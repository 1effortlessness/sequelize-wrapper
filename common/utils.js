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
