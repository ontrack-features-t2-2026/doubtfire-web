# frozen_string_literal: true

# Run with `bundle exec rails runner /path/to/seed.rb` from the API checkout.
# This is a one-shot fixture, not a migration or a production data repair.
expected_database = 'calendar_manual_20260921'
unless Rails.env.development? &&
       ActiveRecord::Base.connection_db_config.database == expected_database &&
       ENV['CALENDAR_QA_SEED'] == '1'
  raise "Use an explicitly opted-in disposable development database named #{expected_database}"
end

if Unit.exists? || User.where.not(username: 'aadmin').exists?
  raise 'The fixture requires an empty application database; it will not overwrite existing data'
end

password = ENV.fetch('CALENDAR_QA_PASSWORD')
raise 'Set a local fixture password with at least 12 characters' if password.length < 12

reference_date = Date.iso8601(ENV.fetch('CALENDAR_QA_REFERENCE_DATE', '2026-09-21'))
Rails.logger.level = :warn
Rails.application.load_tasks
Rake::Task['db:init'].invoke

ActiveRecord::Base.transaction do
  campus = Campus.create!(name: 'Calendar Test Online', abbreviation: 'CAL', mode: 'timetable',
                          active: true, timezone: 'Australia/Melbourne')
  period = TeachingPeriod.create!(period: 'CAL-T2', year: reference_date.year,
                                 start_date: reference_date.beginning_of_month,
                                 end_date: reference_date + 70.days,
                                 active_until: reference_date + 85.days)
  profile = {
    password: password,
    password_confirmation: password,
    has_run_first_time_setup: true,
    opt_in_to_research: false,
    receive_task_notifications: false,
    receive_portfolio_notifications: false,
    receive_feedback_notifications: false
  }
  student = User.create!(profile.merge(username: 'calendar_student', login_id: 'calendar_student',
                                        first_name: 'Calendar', last_name: 'Student', nickname: 'Calendar',
                                        student_id: 'CALQA001', email: 'calendar.student@example.test',
                                        role_id: Role.student_id))
  convenor = User.create!(profile.merge(username: 'calendar_convenor', login_id: 'calendar_convenor',
                                         first_name: 'Calendar', last_name: 'Convenor', nickname: 'Convenor',
                                         email: 'calendar.convenor@example.test', role_id: Role.convenor_id))

  units = [
    ['CAL101', 'Calendar Verification', [
      ['1P', 'Pass submitted for feedback', 0, 2, :ready_for_feedback],
      ['2C', 'Credit completed exercise', 1, 3, :complete],
      ['3D', 'Distinction redo exercise', 2, 4, :redo],
      ['4HD', 'High Distinction revision', 3, 7, :fix_and_resubmit]
    ]],
    ['CAL102', 'Calendar Second Unit', [
      ['1P', 'Second unit pass task', 0, 8, :not_started]
    ]]
  ]

  summary = units.map do |code, name, task_specs|
    unit = Unit.create!(code: code, name: name,
                        description: 'Synthetic data for calendar verification. This is not a real teaching unit.',
                        teaching_period: period, start_date: period.start_date, end_date: period.end_date,
                        active: true, send_notifications: false, allow_flexible_dates: false)
    unit.employ_staff(convenor, Role.convenor)
    project = unit.enrol_student(student, campus)
    project.update!(target_grade: 3)

    task_specs.each do |abbreviation, title, grade, offset, status|
      due_date = reference_date + offset.days
      definition = unit.task_definitions.create!(
        abbreviation: abbreviation, name: title,
        description: "Synthetic #{title.downcase} for calendar verification.",
        target_grade: grade, weighting: 1,
        start_date: Time.zone.local(reference_date.year, reference_date.month, reference_date.day),
        target_date: Time.zone.local(due_date.year, due_date.month, due_date.day),
        upload_requirements: [{ key: 'file0', name: 'Document', type: 'document' }]
      )
      project.task_for_task_definition(definition).update!(task_status: TaskStatus.public_send(status))
    end
    project.update_task_stats
    { code: code, unit_id: unit.id, project_id: project.id }
  end

  # Intentionally leave WebCal disabled so that enabling it is an observed UI step.
  puts({ reference_date: reference_date, username: student.username, units: summary }.to_json)
end
