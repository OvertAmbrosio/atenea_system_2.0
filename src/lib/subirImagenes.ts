import cloudinaryUploader from '../config/cloudinaryUploader';
import fs from 'fs';

interface IFile {
  fieldname?: string,
  originalname?: string,
  encoding?: string,
  mimetype?: string,
  destination?: string,
  filename?: string,
  path: string,
  size?: number
};

interface IResponse {
  url: string,
  titulo?: string,
  id?: string,
  public_id?: string
}

const uploader = async (path: string) => await cloudinaryUploader(path, 'Ordenes');

export default async function subirImagenes(files: Array<IFile|any>): Promise<Array<IResponse>|any> {
  
  let imagenesSubidas: Array<IResponse> = [];

  return new Promise( async(resolve, reject) => {
    try {
      if (!files) {
        console.log('no hay imagenes')
        resolve()
      } else {
        Promise.all(
          files.map(async(file) => {
            await uploader(file.path)
              .then((response: IResponse|any) => {
                let imagen = {
                  titulo: file.originalname,
                  url: response.url,
                  public_id: response.id
                };
                fs.unlinkSync(file.path);
                imagenesSubidas.push(imagen);
              });
          })
        ).then((resultado) => {
          return resolve(imagenesSubidas);
        });
      };
    } catch (error) {
      return reject(error);
    };
  });
}