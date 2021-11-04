import Select from 'react-select'

import '../styles/components/dropdown.less'

export const TimezoneDroopdown = ({ className }) => {
  // array of timezone options
  const timezoneOptions = [
    { label: '(GMT -12:00) Eniwetok, Kwajalein', value: 'Etc/GMT+12' },
    { label: '(GMT -11:00) Midway Island, Samoa', value: 'Pacific/Samoa' },
    { label: '(GMT -10:00) Hawaii', value: 'Etc/GMT+10' },
    { label: '(GMT -9:00) Alaska', value: 'Etc/GMT+9' },
    { label: '(GMT -8:00) Pacific Time (US &amp; Canada)', value: 'Etc/GMT+8' },
    { label: '(GMT -7:00) Mountain Time (US &amp; Canada)', value: 'Etc/GMT+7' },
    { label: '(GMT -6:00) Central Time (US &amp; Canada), Mexico City', value: 'Etc/GMT+6' },
    { label: '(GMT -5:00) Eastern Time (US &amp; Canada), Bogota, Lima', value: 'Etc/GMT+5' },
    { label: '(GMT -4:30) Caracas', value: 'America/Caracas' },
    { label: '(GMT -4:00) Atlantic Time (Canada), Puerto Rico, La Paz', value: 'Etc/GMT+4' },
    { label: '(GMT -3:30) Newfoundland', value: 'Canada/Newfoundland' },
    { label: '(GMT -3:00) Brazil, Buenos Aires, Georgetown', value: 'America/Argentina/Buenos_Aires' },
    { label: '(GMT -2:00) Mid-Atlantic', value: 'Etc/GMT+2' },
    { label: '(GMT -1:00) Azores, Cape Verde Islands', value: 'Atlantic/Azores' },
    { label: '(GMT) Western Europe Time, London, Lisbon, Casablanca', value: 'UTC' },
    { label: '(GMT +1:00) Brussels, Copenhagen, Madrid, Paris', value: 'Europe/Paris' },
    { label: '(GMT +2:00) Kaliningrad, South Africa', value: 'Europe/Kaliningrad' },
    { label: '(GMT +3:00) Baghdad, Riyadh, Moscow, St. Petersburg', value: 'Europe/Moscow' },
    { label: '(GMT +3:30) Tehran', value: 'Asia/Tehran' },
    { label: '(GMT +4:00) Abu Dhabi, Muscat, Baku, Tbilisi', value: 'Asia/Muscat' },
    { label: '(GMT +4:30) Kabul', value: 'Asia/Kabul' },
    { label: '(GMT +5:00) Ekaterinburg, Islamabad, Karachi, Tashkent', value: 'Asia/Yekaterinburg' },
    { label: '(GMT +5:30) Bombay, Calcutta, Madras, New Delhi', value: 'Asia/Calcutta' },
    { label: '(GMT +5:45) Kathmandu, Pokhara', value: 'Asia/Kathmandu' },
    { label: '(GMT +6:00) Almaty, Dhaka, Colombo', value: 'Asia/Dhaka' },
    { label: '(GMT +6:30) Yangon, Mandalay', value: 'Asia/Yangon' },
    { label: '(GMT +7:00) Bangkok, Hanoi, Jakarta', value: 'Asia/Bangkok' },
    { label: '(GMT +8:00) Beijing, Perth, Singapore, Hong Kong', value: 'Asia/Hong_Kong' },
    { label: '(GMT +8:45) Eucla', value: 'Australia/Eucla' },
    { label: '(GMT +9:00) Tokyo, Seoul, Osaka, Sapporo, Yakutsk', value: 'Asia/Tokyo' },
    { label: '(GMT +9:30) Adelaide, Darwin', value: 'Australia/Adelaide' },
    { label: '(GMT +10:00) Eastern Australia, Guam, Vladivostok', value: 'Pacific/Guam' },
    { label: '(GMT +10:30) Lord Howe Island', value: 'Australia/Lord_Howe' },
    { label: '(GMT +11:00) Magadan, Solomon Islands, New Caledonia', value: 'Asia/Magadan' },
    { label: '(GMT +11:30) Norfolk Island', value: 'Pacific/Norfolk' },
    { label: '(GMT +12:00) Auckland, Wellington, Fiji, Kamchatka', value: 'Pacific/Fiji' },
    { label: '(GMT +12:45) Chatham Islands', value: 'Pacific/Chatham' },
    { label: '(GMT +13:00) Apia, Nukualofa', value: 'Pacific/Apia' },
    { label: '(GMT +14:00) Line Islands, Tokelau', value: 'Etc/GMT-14' },
  ]
  return (
    <Dropdown
      className={className}
      placeholder="Select a timezone"
      options={timezoneOptions}
    />
  )
}

export default function Dropdown(props) {
  // For more details see https://react-select.com/styles#overriding-the-theme
  const customTheme = theme => ({
    ...theme,
    borderRadius: 0,
    colors: {
      ...theme.colors,
      neutral0: '#fffaf4',
      primary25: '#ddd',
      primary: '#4d8093',
    },
    spacing: {
      baseUnit: 2,
      menuGutter: 4,
      controlHeight: props.height || 34,
    },
  })

  return (
    <Select
      className="dropdown-select"
      classNamePrefix="dropdown-select"
      theme={customTheme}
      // eslint-disable-next-line react/destructuring-assignment
      ref={props.selectRef}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    />
  )
}
