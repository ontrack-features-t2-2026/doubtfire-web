# Local-only fixture initializer copied into the isolated container, never application source.
abort 'Acceptance initializer requires the disposable test database' unless Rails.env.test? && ENV['DF_TEST_DB_DATABASE'] == 'bucket_acceptance_20260921'
require 'sidekiq/testing'
require 'webmock'
Sidekiq::Testing.fake!
WebMock.enable!
WebMock.disable_net_connect!(allow_localhost: true)
Rails.application.config.after_initialize do
  ActionMailer::Base.delivery_method = :test
  ActionMailer::Base.perform_deliveries = false
  Doubtfire::Application.config.tii_enabled = false
  Rails.cache.write('tii.features_enabled', TCAClient::FeaturesEnabled.new(tenant: TCAClient::FeaturesTenant.new(require_eula: false)))
end
