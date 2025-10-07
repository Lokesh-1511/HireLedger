import express from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/requestLogger.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// Routers
import jobsRouter from './routes/jobs.js';
import applicantsRouter from './routes/applicants.js';
import interviewsRouter from './routes/interviews.js';
import verificationsRouter from './routes/verifications.js';
import assessmentsRouter from './routes/assessments.js';
import authRouter from './routes/auth.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.get('/', (req,res)=> res.json({ success:true, data:'HireLedger API OK' }));

app.use('/api/auth', authRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/applicants', applicantsRouter);
app.use('/api/interviews', interviewsRouter);
app.use('/api/verifications', verificationsRouter);
app.use('/api/assessments', assessmentsRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
