// pages/shop-cart/index.js
const app = getApp()
const api = require('../../utils/request')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    goodsList: {
      saveHidden: true,
      totalPrice: 0,
      totalScoreToPay: 0,
      allSelect: true,
      noSelect: false,
      list: []
    },
    delBtnWidth: 120, //删除按钮宽度单位（rpx）
  },
  initEleWidth() {
    let delBtnWidth = this.getEleWidth(this.data.delBtnWidth)
    this.setData({
      delBtnWidth: delBtnWidth
    })
  },
  getEleWidth(w) {
    let real = 0
    try {
      let res = wx.getSystemInfoSync().windowWidth,
        scale = (750 / 2) / (w / 2)
      real = Math.floor(res / scale)
      return real
    } catch (e) {
      return w
    }
  },
  toIndexPage() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },
  editTap() {
    let list = this.data.goodsList.list
    // for (let i = 0, len = list.length; i < len; i++) {
    //   let curItem = list[i]
    //   curItem.active = false
    // }
    this.setGoodsList(!this.getSaveHide(), this.totalPrice(), this.allSelect(), this.noSelect(), list)
  },
  saveTap() {
    let list = this.data.goodsList.list
    // for (let i = 0, len = list.length; i < len; i++) {
    //   list[i].curItem.active = true
    // }
    this.setGoodsList(!this.getSaveHide(), this.totalPrice(), this.allSelect(), this.noSelect(), list)
  },
  selectTap(e) {
    let index = e.currentTarget.dataset.index,
      list = this.data.goodsList.list
    if (index !== '' && index !== null) {
      list[parseInt(index)].active = !list[parseInt(index)].active
      this.setGoodsList(this.getSaveHide(), this.totalPrice(), this.allSelect(), this.noSelect(), list)
    }
  },
  touchS(e) {
    if (e.touches.length == 1) {
      this.setData({
        startX: e.touches[0].clientX
      })
    }
  },
  touchM(e) {
    let index = e.currentTarget.dataset.index
    if (e.touches.length == 1) {
      let moveX = e.touches[0].clientX,
        disX = this.data.startX - moveX,
        delBtnWidth = this.data.delBtnWidth,
        left = ''
      if (disX === 0 || disX < 0) { // 如果移动距离小于等于0，container位置不变
        left = 'margin-left: 0px'
      } else if (disX > 0) { // 移动距离大于0，container left值等于手指移动距离
        left = 'margin-left: -' + disX + 'px'
        if (disX >= delBtnWidth) {
          left = 'margin-left: -' + delBtnWidth + 'px'
        }
      }
      let list = this.data.goodsList.list
      if (index !== '' && index !== null) {
        list[parseInt(index)].left = left
        this.setGoodsList(this.getSaveHide(), this.totalPrice(), this.allSelect(), this.noSelect(), list)
      }
    }
  },
  touchE(e) {
    let index = e.currentTarget.dataset.index
    if (e.touches.length == 1) {
      let endX = e.touches[0].clientX,
        disX = this.data.startX - endX,
        delBtnWidth = this.data.delBtnWidth
      // 如果距离小于删除按钮的1/2，不显示删除按钮
      let left = disX > delBtnWidth / 2 ? 'margin-left: -' + delBtnWidth + 'px' : 'margin-left: 0'
      let list = this.data.goodsList.list
      if (index !== '' && index !== null) {
        list[parseInt(index)].left = left
        this.setGoodsList(this.getSaveHide(), this.totalPrice(), this.allSelect(), this.noSelect(), list)
      }
    }
  },
  reduceBtnTap(e) {
    let index = e.currentTarget.dataset.index,
      list = this.data.goodsList.list
    if (index !== '' && index !== null) {
      if (list[parseInt(index)].number > 1) {
        list[parseInt(index)].number--
        this.setGoodsList(this.getSaveHide(), this.totalPrice(), this.allSelect(), this.noSelect(), list)
      }
    }
  },
  addBtnTap(e) {
    let that = this,
      index = e.currentTarget.dataset.index,
      list = this.data.goodsList.list
    if (index !== '' && index !== null) {
      // 判断当前商品购买数量是否超过库存
      let carShopBean = list[parseInt(index)],
        carShopBeanStores = 0
      api.fetchRequest({
          url: 'shop/goods/detail',
          data: {
            id: carShopBean.goodsId
          }
        })
        .then(res => {
          carShopBeanStores = res.data.data.basicInfo.stores
          if (list[parseInt(index)].number < carShopBeanStores) {
            list[parseInt(index)].number++
            that.setGoodsList(that.getSaveHide(), that.totalPrice(), that.allSelect(), that.noSelect(), list)
          } else {
            wx.showToast({
              title: '已超出库存',
              icon: 'none',
              duration: 2000
            })
          }
          that.setData({
            curTouchGoodStore: carShopBeanStores
          })
        })
    }
  },
  delItem(e) {
    let index = e.currentTarget.dataset.index,
      list = this.data.goodsList.list
    list.splice(index, 1)
    this.setGoodsList(this.getSaveHide(), this.totalPrice(), this.allSelect(), this.noSelect(), list)
  },
  bindAllSelect() {
    let list = this.data.goodsList.list
    for (let i = 0, len = list.length; i < len; i++) {
      list[i].active = !this.data.goodsList.allSelect
    }
    this.setGoodsList(this.getSaveHide(), this.totalPrice(), this.allSelect(), this.noSelect(), list)
  },
  toPayOrder() {
    wx.showLoading()
    let that = this
    if (this.data.goodsList.noSelect) {
      wx.hideLoading()
      return
    }
    // 重新计算价格，判断库存
    let shopList = [],
      shopCarInfoMem = wx.getStorageSync('shopCarInfo')
    if (shopCarInfoMem && shopCarInfoMem.shopList) {
      shopList = shopCarInfoMem.shopList.filter(el => {
        return el.active
      })
    }
    if (shopList.length == 0) {
      wx.hideLoading()
      return
    }
    let isFail = false,
      doneNumber = 0,
      needDoneNumber = shopList.length
    for (let i = 0, len = shopList.length; i < len; i++) {
      if (isFail) {
        wx.hideLoading()
        return
      }
      let carShopBean = shopList[i]
      // 获取价格和库存
      if (!carShopBean.propertyChildIds || carShopBean.propertyChildIds === '') {
        api.fetchRequest({
            url: '/shop/goods/detail',
            data: {
              id: carShopBean.goodsId
            }
          })
          .then(res => {
            doneNumber++
            if (res.data.data.properties) {
              wx.showModal({
                title: '提示',
                content: res.data.data.name + ' 商品已失效，请重新购买',
                showCanel: false
              })
              isFail = true
              wx.hideLoading()
              return
            }
            if (res.data.data.basicInfo.stores < carShopBean.number) {
              wx.showModal({
                title: '提示',
                content: res.data.data.basicInfo.name + '库存不足，请冲新购买',
                showCanel: false
              })
              isFail = true
              wx.hideLoading()
              return
            }
            if (res.data.data.basicInfo.minPrice !== carShopBean.price) {
              wx.showModal({
                title: '提示',
                content: res.data.data.basicInfo.name + '价格有调整，请冲新购买',
                showCanel: false
              })
              isFail = true
              wx.hideLoading()
              return
            }
            if (needDoneNumber === doneNumber) {
              that.navigateToPayOrder()
            }
          })
      } else {
        api.fetchRequest({
            url: 'shop/goods/price',
            data: {
              goodsId: carShopBean.goodsId,
              propertyChildIds: carShopBean.propertyChildIds
            }
          })
          .then(res => {
            doneNumber++
            if (res.data.data.stores < carShopBean.number) {
              wx.showModal({
                title: '提示',
                content: res.data.data.name + '库存不足，请冲新购买',
                showCanel: false
              })
              isFail = true
              wx.hideLoading()
              return
            }
            if (res.data.data.price !== carShopBean.price) {
              wx.showModal({
                title: '提示',
                content: res.data.data.name + '价格有调整，请冲新购买',
                showCanel: false
              })
              isFail = true
              wx.hideLoading()
              return
            }
            if (needDoneNumber === doneNumber) {
              that.navigateToPayOrder()
            }
          })
      }
    }
  },
  navigateToPayOrder() {
    wx.hideLoading()
    wx.navigateTo({
      url: '/pages/to-pay-order/index'
    })
  },
  deleteSelected() {
    let list = this.data.goodsList.list
    list = list.filter(el => {
      return !el.active
    })
    this.setGoodsList(this.getSaveHide(), this.totalPrice(), this.allSelect(), this.noSelect(), list)
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.initEleWidth()
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    let shopList = []
    // 获取购物车数据
    let shopCarInfoMem = wx.getStorageSync('shopCarInfo')
    if (shopCarInfoMem && shopCarInfoMem.shopList) {
      shopList = shopCarInfoMem.shopList
    }
    this.data.goodsList.list = shopList
    this.setGoodsList(this.getSaveHide(), this.totalPrice(), this.allSelect(), this.noSelect(), shopList)
  },
  setGoodsList(saveHidden, total, allSelect, noSelect, list) {
    this.setData({
      goodsList: {
        saveHidden: saveHidden,
        totalPrice: total,
        allSelect: allSelect,
        noSelect: noSelect,
        list: list,
        totalScoreToPay: this.data.goodsList.totalScoreToPay
      }
    })
    let shopCarInfo = {},
      tempNumber = 0
    shopCarInfo.shopList = list
    for (let i = 0, len = list.length; i < len; i++) {
      tempNumber = tempNumber + list[i].number
    }
    shopCarInfo.shopNum = tempNumber
    wx.setStorage({
      key: 'shopCarInfo',
      data: shopCarInfo
    })
  },
  getSaveHide() {
    return this.data.goodsList.saveHidden
  },
  totalPrice() {
    let list = this.data.goodsList.list,
      total = 0,
      totalScoreToPay = 0
    for (let i = 0, len = list.length; i < len; i++) {
      let curItem = list[i]
      if (curItem.active) {
        total += parseFloat(curItem.price) * curItem.number
        totalScoreToPay += curItem.score * curItem.number
      }
    }
    this.data.goodsList.totalScoreToPay = totalScoreToPay
    total = parseFloat(total.toFixed(2)) // js浮点计算Bug，取两位小说精度
    return total
  },
  allSelect() {
    let list = this.data.goodsList.list,
      allSelect = false
    for (let i = 0, len = list.length; i < len; i++) {
      let curItem = list[i]
      if (curItem.active) {
        allSelect = true
      } else {
        allSelect = false
        break
      }
    }
    return allSelect
  },
  noSelect() {
    let list = this.data.goodsList.list,
      noSelect = 0
    for (let i = 0, len = list.length; i < len; i++) {
      let curItem = list[i]
      if (!curItem.active) {
        noSelect++
      }
    }
    return noSelect == list.length ? true : false
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