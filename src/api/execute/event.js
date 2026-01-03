import request from '@/utils/request'

// 查询任务事件日志（全流程追溯核心）列表
export function listEvent(query) {
  return request({
    url: '/execute/event/list',
    method: 'get',
    params: query,
  })
}

// 查询任务事件日志（全流程追溯核心）详细
export function getEvent(eventId) {
  return request({
    url: '/execute/event/' + eventId,
    method: 'get',
  })
}

// 新增任务事件日志（全流程追溯核心）
export function addEvent(data) {
  return request({
    url: '/execute/event',
    method: 'post',
    data: data,
  })
}

// 修改任务事件日志（全流程追溯核心）
export function updateEvent(data) {
  return request({
    url: '/execute/event',
    method: 'put',
    data: data,
  })
}

// 删除任务事件日志（全流程追溯核心）
export function delEvent(eventId) {
  return request({
    url: '/execute/event/' + eventId,
    method: 'delete',
  })
}

// 开工（SCHEDULED → RUNNING）
export function startTask(taskId) {
  return request({
    url: '/execute/event/start/' + taskId,
    method: 'post',
  })
}

// 暂停（RUNNING → PAUSED）
export function pauseTask(taskId, pauseDuration) {
  return request({
    url: '/execute/event/pause/' + taskId,
    method: 'post',
    data: { pauseDuration },
  })
}

// 恢复（PAUSED → RUNNING）
export function resumeTask(taskId) {
  return request({
    url: '/execute/event/resume/' + taskId,
    method: 'post',
  })
}

// 完工（RUNNING → DONE）
export function completeTask(taskId) {
  return request({
    url: '/execute/event/complete/' + taskId,
    method: 'post',
  })
}
