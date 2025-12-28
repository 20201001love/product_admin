import request from '@/utils/request'

// 查询订单明细列表
export function listOrderLine(query) {
  return request({
    url: '/demand/orderLine/list',
    method: 'get',
    params: query
  })
}

// 查询订单明细详细
export function getOrderLine(orderLineId) {
  return request({
    url: '/demand/orderLine/' + orderLineId,
    method: 'get'
  })
}

// 新增订单明细
export function addOrderLine(data) {
  return request({
    url: '/demand/orderLine',
    method: 'post',
    data: data
  })
}

// 修改订单明细
export function updateOrderLine(data) {
  return request({
    url: '/demand/orderLine',
    method: 'put',
    data: data
  })
}

// 删除订单明细
export function delOrderLine(orderLineId) {
  return request({
    url: '/demand/orderLine/' + orderLineId,
    method: 'delete'
  })
}
