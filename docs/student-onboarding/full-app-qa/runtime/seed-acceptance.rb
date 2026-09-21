# Local-only acceptance data. Run only in a disposable, seeded test database.
abort 'A disposable test environment is required' unless Rails.env.test? && ENV['DF_TEST_DB_DATABASE'] == 'bucket_acceptance_20260921'
require 'factory_bot_rails'
require 'sidekiq/testing'
require 'securerandom'
require 'json'
Sidekiq::Testing.fake!
ActionMailer::Base.perform_deliveries = false
FactoryBot.find_definitions if FactoryBot.factories.none?
abort 'Acceptance fixture already exists; do not create duplicates' if User.exists?(username: 'b6c1-fresh-student')
password = SecureRandom.urlsafe_base64(18)
fresh = FactoryBot.create(:user, :student, username: 'b6c1-fresh-student', first_name: 'Fresh', last_name: 'Acceptance Student', email: 'fresh@example.invalid', password: password, has_run_first_time_setup: false)
convenor = FactoryBot.create(:user, :convenor, username: 'b6c1-convenor', first_name: 'Acceptance', last_name: 'Convenor', email: 'convenor@example.invalid', password: password, has_run_first_time_setup: true)
unit = FactoryBot.create(:unit, name: 'Synthetic Migration Acceptance', code: 'B6C101', student_count: 8, unenrolled_student_count: 0, inactive_student_count: 0, part_enrolled_student_count: 0, task_count: 4, tutorials: 2, perform_submissions: true)
unit.employ_staff(convenor, Role.convenor)
# Deterministic completion spread makes real API box boundaries visible (1..4 tasks).
unit.active_projects.order(:id).each_with_index do |project, index|
  unit.task_definitions.order(:id).each_with_index do |definition, task_index|
    status = task_index <= index % 4 ? TaskStatus.complete : TaskStatus.working_on_it
    project.task_for_task_definition(definition).update!(task_status: status)
  end
end
student = unit.active_projects.first.student
student.update!(username: 'b6c1-enrolled-student', first_name: 'Enrolled', last_name: 'Acceptance Student', email: 'enrolled@example.invalid', password: password, has_run_first_time_setup: true)
unit.active_projects.where.not(user_id: student.id).each_with_index do |project, index|
  project.student.update!(first_name: 'Synthetic', last_name: "Student #{index + 2}", email: "student-#{index + 2}@example.invalid", has_run_first_time_setup: true)
end
output = {api: 'http://127.0.0.1:3011', unit_id: unit.id, unit_code: unit.code, fresh_student: {username: fresh.username, password: password, id: fresh.id}, enrolled_student: {username: student.username, password: password, id: student.id, project_id: student.projects.first.id}, convenor: {username: convenor.username, password: password, id: convenor.id}}
File.write('/tmp/credentials.local.json', JSON.pretty_generate(output))
File.chmod(0600, '/tmp/credentials.local.json')
puts JSON.generate({fixture: 'ready', unit_id: unit.id, active_students: unit.active_projects.count, fresh_project_history: Project.where(user_id: fresh.id).count, task_definitions: unit.task_definitions.count, tutorials: unit.tutorials.count, synthetic_only: true})
