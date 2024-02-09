const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

const drive = google.drive('v3');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads'); // Local onde os arquivos serão temporariamente armazenados
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Nome do arquivo
  },
});

const upload = multer({ storage: storage });

// Configurações para autenticação na API do Google Drive
const auth = new google.auth.GoogleAuth({
  keyFile: 'credenciais.json', // Substitua pelo seu arquivo de credenciais
  scopes: 'https://www.googleapis.com/auth/drive',
});

// ID da pasta no Google Drive
const folderId = '1K4J5ErgUVtepbBpvnLVZrNcOzvUZmtWK'; // ID da pasta fornecida

// Rota para página inicial
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Rota para upload de arquivo
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const fileMetadata = {
      name: req.file.filename,
      parents: [folderId], // Especifica a pasta de destino no Google Drive
    };

    const media = {
      mimeType: req.file.mimetype,
      body: fs.createReadStream(req.file.path),
    };

    const driveResponse = await drive.files.create({
      auth: await auth.getClient(),
      resource: fileMetadata,
      media: media,
      fields: 'id',
    });

    // Remova o arquivo temporário após o upload
    fs.unlinkSync(req.file.path);

    res.send('Arquivo enviado com sucesso!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao enviar o arquivo.');
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
