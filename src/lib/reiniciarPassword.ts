import bcrypt from 'bcrypt';
import Empleado from '../models/Empleado';

export default async function reiniciarPassword(id: string):Promise<Boolean> {
  let status = false
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('12345678', salt);
  let newPassword = hash;
  await Empleado.findByIdAndUpdate({_id: id}, {$set: {'usuario.password': newPassword }})
    .then((res) => status = true)
    .catch((error) => status = false);
  return status
}