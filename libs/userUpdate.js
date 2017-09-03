const _ = require('lodash')

/**
 * 将 userId 赋值给 model
 * @param {array|object} args 参数
 * @param {string} user 对象
 * @param {string} type 类型
 * @return {*}
 * @this model
 */
function userUpdate (args, user, type = 'create') {
  if (!this.attributes.includes('createdUsr') || !this.attributes.includes('updatedUsr')) {
    return args
  }

  if (_.isEmpty(user)) {
    throw new Error('未登录')
  } else {
    user = user.id || user
  }

  if (_.isArray(args)) {
    args.forEach(arg => {
      arg.updatedUsr = user
      if (type === 'create') {
        arg.createdUsr = user
      }
    })
  }

  if (_.isObject(args) && !_.isArray(args)) {
    args.updatedUsr = user
    if (type === 'create') {
      args.createdUsr = user
    }
  }

  return args
}

module.exports = userUpdate
