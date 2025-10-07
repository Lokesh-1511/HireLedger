import { Router } from 'express';
import { listApplicants, createApplicant, updateApplicant, deleteApplicant, bulkMessage } from '../services/applicantsService.js';

const router = Router();

router.get('/', (req,res)=> res.json({ success:true, data:listApplicants() }));
router.post('/', (req,res)=> res.status(201).json({ success:true, data:createApplicant(req.body||{}) }));
router.patch('/:id', (req,res)=> {
  const a=updateApplicant(req.params.id, req.body||{}); if(!a) return res.status(404).json({success:false,error:'Applicant not found'}); res.json({success:true,data:a});
});
router.delete('/:id', (req,res)=> { const ok=deleteApplicant(req.params.id); if(!ok) return res.status(404).json({success:false,error:'Applicant not found'}); res.json({success:true,data:true}); });
router.post('/bulk-message', (req,res)=> { const { ids=[], message='' } = req.body||{}; bulkMessage(ids, message); res.json({success:true,data:true}); });

export default router;
