// const jwt = require('jsonwebtoken');
// const User = require('../models/User');
// const winston = require('winston');
import jwt from 'jsonwebtoken';
import { User } from '../model/user.model.js';
import winston from 'winston';

export const Auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error('Authentication token missing');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      throw new Error('User not found');
    }

    req.user = user;
    next();
  } catch (error) {
    winston.error(`Auth middleware error: ${error.message}`);
    res.status(401).json({ error: 'Please authenticate' });
  }
};