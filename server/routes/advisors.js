import express from 'express';
import { createAdvisor, getAllAdvisors, getAdvisorById } from '../controllers/advisorsController.js';


const router = express.Router();

router.post('/', createAdvisor);
router.get('/', getAllAdvisors);
router.get('/:advisor_id', getAdvisorById);

export default router;
