const app = getApp()
const api = require('../../utils/request')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    goodsDetail: {},
    hasMoreSelect: false,
    selectSize: "选择：",
    selectSizePrice: 0,
    totalScoreToPay: 0,
    shopNum: 0,
    hideShopPopup: true,
    buyNumber: 0,
    buyNumMin: 1,
    buyNumMax: 0,
    videoMp4Src: '',
    posterSrc: '',
    reputation: null,
    curGoodsKanjia: null,
    pingtuanList: [],
    propertyChildIds: '',
    propertyChildNames: '',
    canSubmit: false, // 选中规格尺寸时是否允许加入购物车
    shopCarInfo: {},
    shopType: 'addShopCar', // 购物类型，默认为加入购物车
    kjId: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (options.inviter_id) {
      wx.setStorage({
        key: 'inviter_id_' + options.id,
        data: options.inviter_id
      })
      wx.setStorage({
        key: 'referrer',
        data: options.inviter_id
      })
    }
    let that = this
    that.data.kjId = options.kjId

    // 获取购物车数据
    wx.getStorage({
      key: 'shopCarInfo',
      success: (res => {
        that.setData({
          shopCarInfo: res.data,
          shopNum: res.data.shopNum
        })
      })
    })
    // 获取到商品信息
    api.fetchRequest({
        url: 'shop/goods/detail',
        data: {
          id: options.id
        }
      })
      .then(res => {
        let selectSizeTemp = '',
          dataObj = res.data.data
        if (dataObj.properties) {
          for (let i = 0, len = dataObj.properties.length; i < len; i++) {
            selectSizeTemp = selectSizeTemp + ' ' + dataObj.properties[i].name
          }
          that.setData({
            hasMoreSelect: true,
            selectSize: that.data.selectSize + selectSizeTemp,
            selectSizePrice: dataObj.basicInfo.minPrice,
            totalScoreToPay: dataObj.basicInfo.minScore
          })
        }
        if (dataObj.basicInfo.pingtuan) {
          that.pingtuanList(options.id)
        }
        if (dataObj.basicInfo.videoId) {
          that.getVideoSrc(dataObj.basicInfo.videoId)
        }
        that.setData({
          goodsDetail: dataObj,
          selectSizePrice: dataObj.basicInfo.minPrice,
          totalScoreToPay: dataObj.basicInfo.minScore,
          buyNumMax: dataObj.basicInfo.stores,
          buyNumber: (dataObj.basicInfo.stores > 0) ? 1 : 0
        })
      })
    this.getReputation(options.id)
    this.getBargainInfo(options.id)
  },
  pingtuanList(id) {
    let that = this
    api.fetchRequest({
        url: 'shop/goods/pingtuan/list',
        data: {
          goodsId: id
        }
      })
      .then(res => {
        if (res.data.code == 0) {
          that.setData({
            pingtuanList: res.data.data
          })
        }
      })
  },
  getVideoSrc(id) {
    let that = this
    api.fetchRequest({
        url: '/media/video/detail',
        data: {
          videoId: id
        }
      })
      .then(res => {
        if (res.data.code == 0) {
          that.setData({
            videoMp4Src: res.data.data.fdMp4,
            posterSrc: res.data.data.coverUrl
          })
        }
      })
  },
  getReputation(id) {
    let that = this
    api.fetchRequest({
        url: 'shop/goods/reputation',
        data: {
          goodsId: id
        }
      })
      .then(res => {
        if (res.data.code == 0) {
          that.setData({
            reputation: res.data.data
          })
        }
      })
  },
  getBargainInfo(id) {
    let that = this
    if (!app.globalData.kanjiaList || app.globalData.kanjiaList.length == 0) {
      that.setData({
        curGoodsKanjia: null
      })
      return
    }
    let curGoodsKanjia = app.globalData.kanjiaList.find(ele => {
      return ele.goodsId == id
    })
    if (curGoodsKanjia) {
      that.setData({
        curGoodsKanjia: curGoodsKanjia
      })
    } else {
      that.setData({
        curGoodsKanjia: null
      })
    }
  },
  goShopCar() {
    wx.reLaunch({
      url: '/pages/shop-cart/index'
    })
  },
  toAddShopCar() {
    this.setData({
      shopType: 'addShopCar'
    })
    this.bindGuiGeTap()
  },
  toBuy() {
    this.setData({
      shopType: 'tobuy',
      selectSizePrice: this.data.goodsDetail.basicInfo.minPrice
    })
    this.bindGuiGeTap()
  },
  toPingTuan(e) {
    let pingtuanopenid = 0
    if (e.currentTarget.dataset.pingtuanopenid) {
      pingtuanopenid = e.currentTarget.dataset.pingtuanopenid
    }
    this.setData({
      shopType: 'toPingtuan',
      selectSizePrice: this.data.goodsDetail.basicInfo.pingtuanPrice,
      pingtuanopenid: pingtuanopenid
    })
    this.bindGuiGeTap()
  },
  bindGuiGeTap() {
    this.setData({
      hideShopPopup: false
    })
  },
  closePopupTap() {
    this.setData({
      hideShopPopup: true
    })
  },
  numReduceTap() {
    if (this.data.buyNumber > this.data.buyNumMin) {
      let currentNum = this.data.buyNumber
      currentNum--
      this.setData({
        buyNumber: currentNum
      })
    }
  },
  numAddTap() {
    if (this.data.buyNumber < this.data.buyNumMax) {
      let currentNum = this.data.buyNumber
      currentNum++
      this.setData({
        buyNumber: currentNum
      })
    }
  },
  /**
   * 选择商品规格
   * @param {object}e
   */
  labelItemTap(e) {
    let that = this,
      dataset = e.currentTarget.dataset,
      goodsDetail = that.data.goodsDetail,
      childs = goodsDetail.properties[dataset.propertyindex].childsCurGoods
    // 取消该分类下的子项目的所有选中状态
    for (let k = 0, len = childs.length; k < len; k++) {
      childs[k].active = false
    }
    // 设置当前选中状态
    childs[dataset.propertychildindex].active = true
    // 获取所有的选中规格尺寸数据
    let needSelectNum = goodsDetail.properties.length,
      curSelectNum = 0,
      propertyChildIds = '',
      propertyChildNames = ''
    for (let i = 0, len = goodsDetail.properties.length; i < len; i++) {
      childs = goodsDetail.properties[i].childsCurGoods
      for (let j = 0, cLen = childs.length; j < cLen; j++) {
        if (childs[j].active) {
          curSelectNum++
          propertyChildIds = propertyChildIds + goodsDetail.properties[i].id + ':' + childs[j].id + ','
          propertyChildNames = propertyChildNames + goodsDetail.properties[i].name + ':' + childs[j].name + '  '
        }
      }
    }
    let canSubmit = false
    if (needSelectNum == curSelectNum) {
      canSubmit = true
    }
    // 计算当前价格
    if (canSubmit) {
      api.fetchRequest({
          url: 'shop/goods/price',
          data: {
            goodsId: goodsDetail.basicInfo.id,
            propertyChildIds: propertyChildIds
          }
        })
        .then(res => {
          if (res.data.code == 0) {
            let resData = res.data.data
            that.setData({
              selectSizePrice: resData.price,
              totalScoreToPay: resData.score,
              propertyChildIds: propertyChildIds,
              propertyChildNames: propertyChildNames,
              buyNumMax: resData.stores,
              buyNumber: (resData.stores > 0) ? 1 : 0
            })
          }

        })
    }
    that.setData({
      goodsDetail: goodsDetail,
      canSubmit: canSubmit
    })
  },
  /**
   * 加入购物车
   */
  addShopCar() {
    if (this.data.goodsDetail.properties && !this.data.canSubmit) {
      if (!this.data.canSubmit) {
        wx.showModal({
          title: '提示',
          content: '请选择商品规格',
          showCancel: false
        })
      }
      this.bindGuiGeTap()
      return
    }
    if (this.data.buyNumber < 1) {
      wx.showModal({
        title: '提示',
        content: '购买数量不能为0',
        showCancel: false
      })
      return
    }
    // 组建购物车
    let shopCarInfo = this.buildShopCarInfo()
    this.setData({
      shopCarInfo: shopCarInfo,
      shopNum: shopCarInfo.shopNum
    })

    // 写入本地存储
    wx.setStorage({
      key: 'shopCarInfo',
      data: shopCarInfo
    })
    this.closePopupTap()
    wx.showToast({
      title: '加入购物车',
      icon: 'success',
      duration: 2000
    })
  },
  /**
   * 立即购买
   */
  buyNow(e) {
    let that = this
    let shopType = e.currentTarget.dataset.shopType
    if (this.data.goodsDetail.properties && !this.data.canSubmit) {
      if (!this.data.canSubmit) {
        wx.showModal({
          title: '提示',
          content: '请选择商品规格',
          showCancel: false
        })
      }
      this.bindGuiGeTap()
      wx.showModal({
        title: '提示',
        content: '请先选择规格尺寸哦~',
        showCancel: false
      })
      return
    }
    if (this.data.buyNumber < 1) {
      wx.showModal({
        title: '提示',
        content: '购买数量不能为0',
        showCancel: false
      })
      return
    }
    // 组建立即购买信息
    let buyNowInfo = this.buildBuyNowInfo(shopType)
    // 写入本地存储
    wx.setStorage({
      key: 'buyNowInfo',
      data: buyNowInfo
    })
    this.closePopupTap()
    if (shopType == 'toPingtuan') {
      if (this.data.pingtuanopenid) {
        wx.navigateTo({
          url: '/pages/to-pay-order/index?orderType=buyNow&pingtuanOpenId=' + this.data.pingtuanopenid
        })
      } else {
        api.fetchRequest({
            url: 'shop/goods/pingtuan/open',
            data: {
              token: wx.getStorage('token'),
              goodsId: that.data.goodsDetail.basicInfo.id
            }
          })
          .then(res => {
            if (res.data.code != 0) {
              wx.showToast({
                title: res.data.msg,
                icon: 'none',
                duration: 2000
              })
              return
            }
            wx.navigateTo({
              url: '/pages/to-pay-order/index?orderType=buyNow&pingtuanOpenId=' + res.data.data.id
            })
          })
      }
    } else {
      wx.navigateTo({
        url: '/pages/to-pay-order/index?orderType=buyNow'
      })
    }
  },
  joinPingtuan(e) {
    let pingtuanopenid = e.currentTarget.dataset.pingtuanopenid
    wx.navigateTo({
      url: '/pages/to-pay-order/index?orderType=buyNow&pingtuanOpenId=' + pingtuanopenid
    })
  },
  /**
   * 组建购物车信息
   */
  buildShopCarInfo() {
    // 加入购物车
    let shopCarMap = {},
      basicInfo = this.data.goodsDetail.basicInfo
    shopCarMap.goodsId = basicInfo.id
    shopCarMap.pic = basicInfo.pic
    shopCarMap.name = basicInfo.name
    shopCarMap.propertyChildIds = this.data.propertyChildIds
    shopCarMap.label = this.data.propertyChildNames
    shopCarMap.price = this.data.selectSizePrice
    shopCarMap.score = this.data.totalScoreToPay
    shopCarMap.left = ''
    shopCarMap.active = true
    shopCarMap.number = this.data.buyNumber
    shopCarMap.logisticsType = basicInfo.logisticsId
    shopCarMap.logistics = this.data.goodsDetail.logistics
    shopCarMap.weight = basicInfo.weight

    let shopCarInfo = this.data.shopCarInfo
    if (!shopCarInfo.shopNum) {
      shopCarInfo.shopNum = 0
    }
    if (!shopCarInfo.shopList) {
      shopCarInfo.shopList = []
    }
    let hasSameGoodsIndex = -1
    for (let i = 0, len = shopCarInfo.shopList.length; i < len; i++) {
      let tmpShopCarMap = shopCarInfo.shopList[i]
      if (tmpShopCarMap.goodsId == shopCarMap.goodsId && tmpShopCarMap.propertyChildIds == shopCarMap.propertyChildIds) {
        hasSameGoodsIndex = i
        shopCarMap.number = shopCarMap.number + tmpShopCarMap.number
        break
      }
    }
    shopCarInfo.shopNum = shopCarInfo.shopNum + this.data.buyNumber
    if (hasSameGoodsIndex > -1) {
      shopCarInfo.shopList.splice(hasSameGoodsIndex, 1, shopCarMap)
    } else {
      shopCarInfo.shopList.push(shopCarMap)
    }
    shopCarInfo.kjId = this.data.kjId
    return shopCarInfo
  },
  /**
   * 组建立即购买信息
   */
  buildBuyNowInfo(type) {
    let shopCarMap = {},
      basicInfo = this.data.goodsDetail.basicInfo
    shopCarMap.goodsId = basicInfo.id
    shopCarMap.pic = basicInfo.pic
    shopCarMap.name = basicInfo.name
    shopCarMap.propertyChildIds = this.data.propertyChildIds
    shopCarMap.label = this.data.propertyChildNames
    shopCarMap.price = this.data.selectSizePrice
    if (type == 'toPingtuan') {
      shopCarMap.price = basicInfo.pingtuanPrice
    }
    shopCarMap.score = this.data.totalScoreToPay
    shopCarMap.left = ''
    shopCarMap.active = true
    shopCarMap.number = this.data.buyNumber
    shopCarMap.logisticsType = basicInfo.logisticsId
    shopCarMap.logistics = this.data.goodsDetail.logistics
    shopCarMap.weight = basicInfo.weight

    let buyNowInfo = {}
    buyNowInfo.shopNum = buyNowInfo.shopNum ? buyNowInfo.shopNum : 0
    buyNowInfo.shopList = buyNowInfo.shopList ? buyNowInfo.shopList : []

    buyNowInfo.shopList.push(shopCarMap)
    buyNowInfo.kjId = this.data.kjId
    return buyNowInfo
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
    return {
      title: this.data.goodsDetail.basicInfo.name,
      path: '/pages/goods-details/index?id=' + this.data.goodsDetail.basicInfo.id + '&inviter_id=' + wx.getStorageSync('uid'),
      success: res => {
        
      }
    }
  }
})