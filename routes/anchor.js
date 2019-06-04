// Copyright (c) 2018-2019, BB Jansen
//
// Please see the included LICENSE file for more information.
'use strict'

const express = require('express')
const router = express.Router()
const { check } = require('express-validator/check')
const validateInput = require('../middleware/validateInput')
const db = require('../utils/utils').knex

// Get anchor by id
router.get('/:anchor',
  [
    check('anchor')
      .not().isEmpty()
      .isLength({
        min: 44,
        max: 88
      })
  ],
  validateInput,
  async function (req, res, next) {
    try {
      const getAnchor = await db('anchors')
        .select('tid', 'anchor')
        .where('anchor', req.params.anchor)

      res.status(200).json(getAnchor)
    } catch (err) {
      next(err)
    }
  })

// Get anchor by tid
router.get('/transaction/:id',
  [
    check('id')
      .not().isEmpty()
      .isLength({
        min: 44,
        max: 44
      })
  ],
  validateInput,
  async function (req, res, next) {
    try {
      const getAnchor = await db('anchors')
        .select('tid', 'anchor')
        .where('tid', req.params.id)

      res.status(200).json(getAnchor)
    } catch (err) {
      next(err)
    }
  })

module.exports = router
