const
  _ = require('lodash'),
  util = require('../common/utils'),
  pluralize = require('pluralize')

/**
 * 查找相关的数据, 更新或者插入
 * @param {object} source source model
 * @param {string} model target model
 * @param {object|array} args 要生成的参数
 * @param {any} t 事务标志
 * @return {Promise.<void>}
 * @this model
 */
async function one2one (source, model, args = {}, t) {
  let sourceId = `${this.name}Id`
  let previous = await this.models[model].findOne({
    where: {[sourceId]: source.id},
    transaction: t
  })

  if (!args.hasOwnProperty(sourceId)) {
    args[sourceId] = source.id
  }
  let insert = await util.insertOrUpdate(this.models[model], args, t)

  if (insert) {
    await previous.update({[sourceId]: null}, {transaction: t})
  }
}

/**
 * 查找相关的数据, 更新或者插入
 * @param {object} source source model
 * @param {string} model target model
 * @param {object|array} args 要生成的参数
 * @param {any} t 事务标志
 * @return {Promise.<void>}
 * @this model
 */
async function one2many (source, model, args = [], t) {
  let sourceId = `${this.name}Id`
  let previous = await this.models[model].findAll({
    where: {[sourceId]: source.id},
    transaction: t
  })
  let deletedIds = []
  let currentIds = args.map(i => i.id)

  previous.forEach(i => {
    if (!currentIds.includes(i.id)) {
      deletedIds.push(i.id)
    }
  })
  if (deletedIds.length !== 0) {
    await this.models[model].update({[sourceId]: null}, {
      where: {id: {$in: deletedIds}},
      transaction: t
    })
  }

  for (let arg of args) {
    if (!arg.hasOwnProperty(sourceId)) {
      arg[sourceId] = source.id
    }

    await util.insertOrUpdate(this.models[model], arg, t)
  }
}

/**
 * 查找相关的数据, 更新或者插入
 * @param {object} source source model
 * @param {string} model target model
 * @param {object|array} args 要生成的参数
 * @param {any} t 事务标志
 * @return {Promise.<void>}
 * @this model
 */
async function many2many (source, model, args = [], t) {
  let pluralModel = pluralize.plural(model)
  let current = []

  if (args.every(arg => _.isObject(arg))) {
    for (let arg of args) {
      await util.insertOrUpdate(this.models[model], arg, t)
      let obj = await this.models[model].findOne({
        where: arg,
        transaction: t
      })

      if (obj) {
        current.push(obj)
      }
    }
  } else {
    current = await this.models[model].findAll({
      where: {id: {$in: args}},
      transaction: t
    })
  }

  await source[`set${_.upperFirst(this.associations[pluralModel].as)}`](current, {transaction: t})
}

/**
 * 查找相关的数据, 更新或者插入
 * @param {object} source source model
 * @param {string} model target model
 * @param {object|array} args 要生成的参数
 * @param {any} t 事务标志
 * @return {*}
 * @this model
 */
async function findOrUpdateOrCreate (source, model, args, t) {
  let association = this.associations[model] || this.associations[pluralize.plural(model)]

  switch (association.associationType) {
    case 'HasOne':
      await one2one.call(this, source, model, args, t)
      break
    case 'HasMany':
      await one2many.call(this, source, model, args, t)
      break
    case 'BelongsToMany':
      await many2many.call(this, source, model, args, t)
      break
    default:
      throw new Error(`当前关系: ${association}, 数据不一致`)
  }
}

module.exports = findOrUpdateOrCreate

