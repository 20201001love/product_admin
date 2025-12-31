import request from '@/utils/request'

// 查询班次日历列表
export function listCalendar(query) {
  return request({
    url: '/master/calendar/list',
    method: 'get',
    params: query,
  })
}

// 查询班次日历详细
export function getCalendar(calendarId) {
  return request({
    url: '/master/calendar/' + calendarId,
    method: 'get',
  })
}

// 新增班次日历
export function addCalendar(data) {
  return request({
    url: '/master/calendar',
    method: 'post',
    data: data,
  })
}

// 修改班次日历
export function updateCalendar(data) {
  return request({
    url: '/master/calendar',
    method: 'put',
    data: data,
  })
}

// 删除班次日历
export function delCalendar(calendarId) {
  return request({
    url: '/master/calendar/' + calendarId,
    method: 'delete',
  })
}

// 启用/停用班次日历
export function changeCalendarStatus(calendarId, status) {
  return request({
    url: '/master/calendar/changeStatus',
    method: 'put',
    data: {
      calendarId,
      status
    }
  })
}

