import request from '@/utils/request'

// 查询工序任务列表
export function listTask(query) {
  return request({
    url: '/pps/task/list',
    method: 'get',
    params: query,
  })
}

// 查询工序任务详细
export function getTask(taskId) {
  return request({
    url: '/pps/task/' + taskId,
    method: 'get',
  })
}

// 新增工序任务
export function addTask(data) {
  return request({
    url: '/pps/task',
    method: 'post',
    data: data,
  })
}

// 修改工序任务
export function updateTask(data) {
  return request({
    url: '/pps/task',
    method: 'put',
    data: data,
  })
}

// 删除工序任务
export function delTask(taskId) {
  return request({
    url: '/pps/task/' + taskId,
    method: 'delete',
  })
}

// 取消任务（READY → CANCELLED）
export function cancelTask(taskId) {
  return request({
    url: '/pps/task/cancel/' + taskId,
    method: 'put',
  })
}

// 恢复任务（CANCELLED → READY）
export function restoreTask(taskId) {
  return request({
    url: '/pps/task/restore/' + taskId,
    method: 'put',
  })
}

// 撤销排程（SCHEDULED → READY，同时删除派工记录）
export function revokeSchedule(taskId) {
  return request({
    url: '/pps/task/revokeSchedule/' + taskId,
    method: 'put',
  })
}
