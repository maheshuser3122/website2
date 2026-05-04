#!/usr/bin/env node

import BatchPhotoProcessingService from './src/services/batchPhotoProcessingService.js';

try {
  console.log('Creating BatchPhotoProcessingService...');
  const service = new BatchPhotoProcessingService();
  console.log('✅ Service created successfully');
  console.log('Methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(service)).filter(m => m !== 'constructor'));
} catch (error) {
  console.error('❌ Error creating service:', error.message);
  console.error(error.stack);
}
