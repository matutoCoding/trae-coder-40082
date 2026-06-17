export default defineAppConfig({
  pages: [
    'pages/schedule/index',
    'pages/recurrence/index',
    'pages/approval/index',
    'pages/occupancy/index',
    'pages/room-detail/index',
    'pages/booking-form/index',
    'pages/rule-config/index',
    'pages/recurrence-edit/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#165DFF',
    navigationBarTitleText: '会议室预约',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F5F6F7'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#165DFF',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/schedule/index',
        text: '排期'
      },
      {
        pagePath: 'pages/recurrence/index',
        text: '周期'
      },
      {
        pagePath: 'pages/approval/index',
        text: '审批'
      },
      {
        pagePath: 'pages/occupancy/index',
        text: '占用'
      }
    ]
  }
})
