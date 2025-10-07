import { Router } from 'express';
import { listInterviews, createInterview, updateInterview, deleteInterview } from '../services/interviewsService.js';

const router = Router();

router.get('/', (req,res)=> res.json({ success:true, data:listInterviews() }));
router.post('/', (req,res)=> res.status(201).json({ success:true, data:createInterview(req.body||{}) }));
router.patch('/:id', (req,res)=> { const it=updateInterview(req.params.id, req.body||{}); if(!it) return res.status(404).json({success:false,error:'Interview not found'}); res.json({success:true,data:it}); });
router.delete('/:id', (req,res)=> { const ok=deleteInterview(req.params.id); if(!ok) return res.status(404).json({success:false,error:'Interview not found'}); res.json({success:true,data:true}); });

export default router;
