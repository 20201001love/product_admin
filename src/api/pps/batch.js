import request from '@/utils/request'

// 查询生产批次（订单行拆批）列表
export function listBatch(query) {
  return request({
    url: '/pps/batch/list',
    method: 'get',
    params: query,
  })
}

// 查询生产批次（订单行拆批）详细
export function getBatch(batchId) {
  return request({
    url: '/pps/batch/' + batchId,
    method: 'get',
  })
}

// 新增生产批次（订单行拆批）
export function addBatch(data) {
  return request({
    url: '/pps/batch',
    method: 'post',
    data: data,
  })
}

// 修改生产批次（订单行拆批）
export function updateBatch(data) {
  return request({
    url: '/pps/batch',
    method: 'put',
    data: data,
  })
}

// 删除生产批次（订单行拆批）
export function delBatch(batchId) {
  return request({
    url: '/pps/batch/' + batchId,
    method: 'delete',
  })
}

// 释放生产批次（订单行拆批）
export function releaseBatch(batchId) {
  return request({
    url: '/pps/batch/release/' + batchId,
    method: 'put',
  })
}

// 取消释放生产批次（订单行拆批）
export function cancelReleaseBatch(batchId) {
  return request({
    url: '/pps/batch/cancelRelease/' + batchId,
    method: 'put',
  })
}
