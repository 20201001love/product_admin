import request from '@/utils/request'

// 查询派工/排程结果列表
export function listAssignment(query) {
  return request({
    url: '/pps/assignment/list',
    method: 'get',
    params: query
  })
}

// 查询派工/排程结果详细
export function getAssignment(assignmentId) {
  return request({
    url: '/pps/assignment/' + assignmentId,
    method: 'get'
  })
}

// 新增派工/排程结果
export function addAssignment(data) {
  return request({
    url: '/pps/assignment',
    method: 'post',
    data: data
  })
}

// 修改派工/排程结果
export function updateAssignment(data) {
  return request({
    url: '/pps/assignment',
    method: 'put',
    data: data
  })
}

// 删除派工/排程结果
export function delAssignment(assignmentId) {
  return request({
    url: '/pps/assignment/' + assignmentId,
    method: 'delete'
  })
}
