import { Router } from 'express';
import { listJobs, getJob, createJob, updateJob, deleteJob } from '../services/jobsService.js';

const router = Router();

router.get('/', (req,res)=> res.json({ success:true, data:listJobs() }));
router.get('/:id', (req,res)=> {
  const job=getJob(req.params.id); if(!job) return res.status(404).json({success:false,error:'Job not found'});
  res.json({success:true,data:job});
});
router.post('/', (req,res)=> {
  const job=createJob(req.body||{}); res.status(201).json({success:true,data:job});
});
router.patch('/:id', (req,res)=> {
  const job=updateJob(req.params.id, req.body||{}); if(!job) return res.status(404).json({success:false,error:'Job not found'}); res.json({success:true,data:job});
});
router.delete('/:id', (req,res)=> {
  const ok=deleteJob(req.params.id); if(!ok) return res.status(404).json({success:false,error:'Job not found'}); res.json({success:true,data:true});
});

export default router;
