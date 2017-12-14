const _ = require('lodash')

exports.insertOrUpdate = async (model, args, t) => {
  let result

  if (_.isArray(args)) {
    result = []
    for (let arg of args) {
      result.push(await exports.insertOrUpdate(model, arg, t))
    }
  }

  if (_.isObject(args)) {
    if (args.hasOwnProperty('id')) {
      let obj = await model.findById(args.id, {transaction: t})

      if (obj) {
        return obj.update(args, {transaction: t})
      }
    }

    return model.create(args, {transaction: t})
  }

  return result
}

/**
 * limit 和 offset 判断与处理
 * @param {array} objs 待处理的对象
 * @param {object} args 前端传过来的参数
 * @return {array}
 */

exports.pagination = (objs, args) => {
  if (args.limit && !args.offset) {
    return objs.slice(0, args.limit)
  }  else if (args.offset && !args.limit) {
    return objs.slice(args.offset)
  } else if (args.limit && args.offset) {
    return objs.slice(args.offset, args.limit + args.offset)
  }
  return objs
}
