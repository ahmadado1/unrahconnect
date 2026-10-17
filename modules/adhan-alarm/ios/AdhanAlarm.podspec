Pod::Spec.new do |s|
  s.name           = 'AdhanAlarm'
  s.version        = '1.0.0'
  s.summary        = 'Full Adhan alarms with AlarmKit'
  s.description    = 'Schedules the full Adhan at prayer times as iOS 26 AlarmKit alarms.'
  s.author         = 'UmrahConnect'
  s.homepage       = 'https://myumrahconnect.com'
  s.license        = { :type => 'MIT' }
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES', 'SWIFT_COMPILATION_MODE' => 'wholemodule' }
  s.source_files = "**/*.{h,m,swift}"
end
