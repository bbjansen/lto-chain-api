// Copyright (c) 2018-2019, BB Jansen
//
// Please see the included LICENSE file for more information.
'use strict'

const express = require('express')
const router = express.Router()
const { check } = require('express-validator/check')
const validateInput = require('../middleware/validateInput')
const db = require('../utils/utils').knex

// Get unverified transactions
router.get('/unverified', async function (req, res, next) {
  try {
    const getTx = await db('transactions')
      .select()
      .where('verified', false)
      .orderBy('timestamp', 'desc')

    res.status(200).json(getTx)
  } catch (err) {
    next(err)
  }
})

// Get transaction by id
router.get('/:id',
[
  check('id')
    .not().isEmpty()
    .isLength({
      min: 43,
      max: 44
    })
],
validateInput,
async function (req, res, next) {
  try {
    const getTx = await db('transactions')
      .select()
      .where('id', req.params.id)

    // Mass Tx
    if (getTx[0].type === 11) {
      const proofs = await db('proofs')
        .select('proof')
        .where('tid', req.params.id)

      getTx.push({ proofs: proofs })

      const transfers = await db('transfers')
        .select('recipient', 'amount')
        .where('tid', req.params.id)

      getTx.push({ transfers: transfers })
    }

    // Anchor Tx
    if (getTx[0].type === 15) {
      const proofs = await db('proofs')
        .select('proof')
        .where('tid', req.params.id)

      getTx.push({ proofs: proofs })

      const anchors = await db('anchors')
        .select('anchor')
        .where('tid', req.params.id)

      getTx.push({ anchors: anchors })
    }

    // Lease Tx
    if (getTx[0].type === 8) {
      const canceled = await db('transactions')
        .select()
        .where('leaseId', req.params.id)

      if (canceled.length >= 1) {
        getTx[0].status = 'canceled'
      }
    }

    // Cancel Lease Tx
    if (getTx[0].type === 9) {

    }

    res.status(200).json(getTx[0])
  } catch (err) {
    next(err)
  }
})

// Get transactions by block index
router.get('/block/:index',
[
  check('index').not().isEmpty().isInt({ min: 1 })
],
validateInput,
async function (req, res, next) {
  try {
    const getTx = await db('transactions')
      .select()
      .where('block', req.params.index)

    res.status(200).json(getTx)
  } catch (err) {
    next(err)
  }
})

// Get transactions by address
router.get('/address/:address',
[
  check('address')
    .not().isEmpty().isLength({ min: 35, max: 35 })
],
validateInput,
async function (req, res, next) {
  try {
    const getSender = await db('transactions')
      .select()
      .where('sender', req.params.address)

    const getRecipient = await db('transactions')
      .select()
      .where('recipient', req.params.address)

    const tx = getSender.concat(getRecipient)

    res.status(200).json(tx)
  } catch (err) {
    next(err)
  }
})

// Get by sender stats (all time)
router.get('/sender/all', async function (req, res, next) {
  try {
    const getAddresses = await db('transactions')
      .leftJoin('addresses', 'transactions.sender', 'addresses.address')
      .select('addresses.address')
      .count('transactions.id as transactions')
      .where('transactions.verified', true)
      .groupBy('addresses.address')
      .orderBy('transactions', 'desc')

    let total = getAddresses.reduce((transactions, address, index, getAddresses) => {
      return transactions += address.transactions
    }, 0)

    getAddresses.forEach(address => {
      address.share = (address.transactions / total).toFixed(5) || 0
    })

    res.status(200).json(getAddresses)
  } catch (err) {
    next(err)
  }
})

// Get by recipient stats (all time)
router.get('/recipient/all', async function (req, res, next) {
  try {
    const getAddresses = await db('transactions')
      .leftJoin('addresses', 'transactions.recipient', 'addresses.address')
      .select('addresses.address')
      .count('transactions.id as transactions')
      .where('transactions.verified', false)
      .whereNotNull('transactions.recipient')
      .groupBy('addresses.address')
      .orderBy('transactions', 'desc')

    let total = getAddresses.reduce((transactions, address, index, addresses) => {
      return transactions += address.transactions
    }, 0)

    getAddresses.forEach(address => {
      address.share = (address.transactions / total).toFixed(5) || 0
    })

    res.status(200).json(getAddresses)
  } catch (err) {
    next(err)
  }
})

module.exports = router
