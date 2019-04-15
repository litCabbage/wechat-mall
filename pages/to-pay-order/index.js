// pages/to-pay-order/index.js
const app = getApp()
const api = require('../../utils/request')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    totalScoreToPay: 0,
    goodsList: [],
    curAddressData: null,
    isNeedLogistics: 0, // 是否需要物流信息
    allGoodsPrice: 0,
    yunPrice: 0,
    allGoodsPrice: 0,
    goodsJsonStr: '',
    orderType: '', //订单类型，购物车下单或立即支付下单，默认是购物车
    pingtuanOpenId: '', //拼团记录团号
    hasNoCoupons: true,
    coupons: [],
    couponAmount: 0, // 优惠券金额
    curCoupon: null, // 当前选择使用的优惠券
  },
  addAddress() {
    wx.navigateTo({
      url: '/pages/address-add/index'
    })
  },
  selectAddress() {
    wx.navigateTo({
      url: '/pages/selsect-address/index'
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      isNeedLogistics: 1,
      orderType: options.orderType,
      pingtuanOpenId: options.pingtuanOpenId
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    let that = this,
      shopList = []
    // 立即购买下单
    if (that.data.orderType === 'buyNow') {
      let buyNowInfoMem = wx.getStorageSync('buyNowInfo')
      that.data.kjId = buyNowInfoMem.kjId
      if (buyNowInfoMem && buyNowInfoMem.shopList) {
        shopList = buyNowInfoMem.shopList
      }
    } else {
      // 购物车下单
      let shopCarInfoMem = wx.getStorageSync('shopCarInfo')
      that.data.kjId = shopCarInfoMem.kjId
      if (shopCarInfoMem && shopCarInfoMem.shopList) {
        shopList = shopCarInfoMem.shopList.filter( el => {
          return el.active
        })
      }
    }
    that.setData({
      goodsList: shopList
    })
    that.initAddress()
  },
  initAddress() {
    let that = this
    api.fetchRequest({
      url: 'user/shipping-address/default',
      data: {
        token: wx.getStorageSync('token')
      }
    })
    .then(res => {
      if (res.data.code === 0) {
        that.setData({
          curAddressData: res.data.data
        })
      } else {
        that.setData({
          curAddressData: null
        })
      }
      that.processFreight()
    })
  },
  processFreight() {
    let that = this,
      goodsList = this.data.goodsList,
      goodsJsonStr = '[',
      isNeedLogistics = 0,
      allGoodsPrice = 0

    for (let i = 0, len = goodsList.length; i < len; i++) {
      let carShopBean = goodsList[i]
      if (carShopBean.logistics) {
        isNeedLogistics = 1
      }
      allGoodsPrice += carShopBean.price * carShopBean.number

      let goodsJsonStrTmp = ''
      if (i > 0) {
        goodsJsonStrTmp = ','
      }

      let inviter_id = 0,
        inviter_id_storage = wx.getStorageSync('inviter_id_' + carShopBean.goodsId)
      if (inviter_id_storage) {
        inviter_id = inviter_id_storage
      }
      // ${carShopBean.propertyChildIds} 后面不用跟',' 因为在拼接propertyChildIds的时候后面多加了一个','
      // goodsJsonStrTmp += `{"goodsId":${carShopBean.goodsId},"number":${carShopBean.number},"propertyChildIds":${carShopBean.propertyChildIds},"logisticsType":0,"inviter_id":${inviter_id}}` 
      goodsJsonStrTmp += `{"goodsId":${carShopBean.goodsId},"number":${carShopBean.number},"propertyChildIds":${carShopBean.propertyChildIds}"logisticsType":0,"inviter_id":${inviter_id}}` 
      goodsJsonStr += goodsJsonStrTmp
    }
    goodsJsonStr += ']'
    console.log(goodsJsonStr)
    that.setData({
      isNeedLogistics: isNeedLogistics,
      goodsJsonStr: goodsJsonStr
    })
    
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})