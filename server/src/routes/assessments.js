import { Router } from 'express';
import { listRoles, getRoleStats, recordAttempt } from '../services/assessmentsService.js';

const router = Router();

router.get('/roles', (req,res)=> res.json({ success:true, data:listRoles() }));
router.get('/roles/:role', (req,res)=> { const stats=getRoleStats(req.params.role); if(!stats) return res.status(404).json({success:false,error:'Role not found'}); res.json({success:true,data:stats}); });
router.post('/roles/:role/attempts', (req,res)=> { const { scorePct=0, elapsedSec=0 } = req.body||{}; const stats=recordAttempt(req.params.role, scorePct, elapsedSec); res.status(201).json({success:true,data:stats}); });

export default router;
