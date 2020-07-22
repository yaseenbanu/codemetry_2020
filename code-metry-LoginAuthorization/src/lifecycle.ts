import * as fs from 'fs';
import { getCodeMetryDir } from './lib/Loggers';

let deleteFolderRecursive = function(path: fs.PathLike) {
    if (fs.existsSync(path)) {
      fs.readdirSync(path).forEach(function(file) {
        var curPath = path + "/" + file;
        if (fs.lstatSync(curPath).isDirectory()) { // recurse
          deleteFolderRecursive(curPath);
        } else { // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(path);
    }
};


deleteFolderRecursive(getCodeMetryDir());
