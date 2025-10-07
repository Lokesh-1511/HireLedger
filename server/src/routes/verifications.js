import { Router } from 'express';
import { listVerifications, requestVerification, markVerification } from '../services/verificationsService.js';

const router = Router();

router.get('/', (req,res)=> res.json({ success:true, data:listVerifications() }));
router.post('/', (req,res)=> res.status(201).json({ success:true, data:requestVerification(req.body?.name||'Untitled') }));
router.patch('/:id', (req,res)=> { const v=markVerification(req.params.id, req.body?.status||'verified'); if(!v) return res.status(404).json({success:false,error:'Verification not found'}); res.json({success:true,data:v}); });

export default router;
