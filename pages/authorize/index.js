// pages/authorize/index.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

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

  },

  bindGetUserInfo(e) {
    if (!e.detail.userInfo) {
      return
    }
    if (app.globalData.isConnected) {
      wx.setStorageSync('userInfo', e.detail.userInfo)
      this.login()
    } else {
      wx.showToast({
        title: '当前无网络',
        icon: 'none'
      })
    }
  },
  login() {
    let that = this
    let token = wx.getStorageSync('token');
    if (token) {
      wx.request({
        url: 'https://api.it120.cc/' + app.globalData.subDomain + 'user/check-token',
        data: {
          token: 'token'
        },
        success: (res) => {
          if (res.data.code != 0) {
            wx.removeStorageSync('token')
            that.login()
          } else {
            // 回到原来的地方
            // wx.navigateBack()
            var pages = getCurrentPages();
            var prevPage = pages[pages.length - 2];//上一页
            var urlPage = pages[pages.length - 3];
            wx.redirectTo({
              url: '/' + prevPage.route,
            })
          }
        }
      })
      return
    }
    wx.login({
      success: (res) => {
        wx.request({
          url: 'https://api.it120.cc/' + app.globalData.subDomain + '/user/wxapp/login',
          data: {
            code: res.code
          },
          success: (res) => {
            if (res.data.code == 10000) {
              // 去注册
              that.registerUser()
              return
            }
            if (res.data.code != 0) {
              // 登录错误
              wx.hideLoading()
              wx.showModal({
                title: '提示',
                content: '无法登录，请重试',
                showCancel: false
              })
              return
            }
            wx.setStorageSync('token', res.data.data.token)
            wx.setStorageSync('uid', res.data.data.uid)
            var pages = getCurrentPages();
            var prevPage = pages[pages.length - 2];//上一页
            var urlPage = pages[pages.length - 3];
            wx.redirectTo({
              url: '/' + prevPage.route,
            })
            // // 回到原来的地方
            // wx.navigateBack()
          }
        })
      }
    })
  }
})