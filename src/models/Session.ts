import { Schema, model, Document } from 'mongoose';

export interface ISession extends Document {
  email?: string;
}

const sessionSchema = new Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true
  },
  createAt: {
    type: Date,
    required: true,
    //Date . now tiene retraso de media hora, pero new Date no acepta el expires
    default: Date.now(),
    index: { expires : '12h' },
  },
});

export default model<ISession>('Session', sessionSchema)
