const express = require('express');
const sql     = require('mssql');
const config  = require('./dbconfig');
const path    = require('path');
const PDFDocument = require('pdfkit');
const app     = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ══════════════════════════════════════
//  PERSONNEL
// ══════════════════════════════════════
app.get('/api/personel', async (req, res) => {
  try {
    const pool   = await sql.connect(config);
    const result = await pool.request()
      .query(`
        SELECT
          p.MATRICULE AS MATRICULE,
          p.NOM       AS NOM,
          p.PRENOM    AS PRENOM,
          p.CODE_S    AS CODE_S,
          s.LIBELLE   AS LIBELLE
        FROM [ONEP].[dbo].[PERSONNEL] p
        LEFT JOIN [ONEP].[dbo].[SERVICE] s
          ON p.CODE_S = s.CODE_S
      `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.json({ success: false, message: err.message });
  } finally {
    await sql.close();
  }
});

app.get('/api/personel/:matricule', async (req, res) => {
  try {
    const pool   = await sql.connect(config);
    const result = await pool.request()
      .input('MATRICULE', sql.Int, parseInt(req.params.matricule))
      .query(`
        SELECT
          p.MATRICULE  AS MATRICULE,
          p.NOM        AS NOM,
          p.PRENOM     AS PRENOM,
          p.CODE_S     AS CODE_S,
          s.LIBELLE    AS LIBELLE,
          d.LIBELLE    AS DIVISION
        FROM [ONEP].[dbo].[PERSONNEL] p
        LEFT JOIN [ONEP].[dbo].[SERVICE] s
          ON p.CODE_S = s.CODE_S
        LEFT JOIN [ONEP].[dbo].[DIVISION] d
          ON s.CODE_D = d.CODE_D
        WHERE p.MATRICULE = @MATRICULE
      `);

    if (result.recordset.length === 0)
      return res.json({ success: false, message: 'Personnel introuvable.' });

    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    res.json({ success: false, message: err.message });
  } finally {
    await sql.close();
  }
}); 
app.post('/api/personel', async (req, res) => {
  const { matricule, nom, prenom, code_s } = req.body;

  if (!matricule || !nom || !prenom || !code_s) {
    return res.json({ success: false, message: 'Champs manquants.' });
  }

  try {
    const pool = await sql.connect(config);

    const serviceCheck = await pool.request()
      .input('CODE_S', sql.VarChar(20), String(code_s))
      .query('SELECT CODE_S FROM [ONEP].[dbo].[SERVICE] WHERE CODE_S = @CODE_S');

    if (serviceCheck.recordset.length === 0) {
      return res.json({ success: false, message: `Service ${code_s} introuvable.` });
    }

    await pool.request()
      .input('MATRICULE', sql.Int,         parseInt(matricule))
      .input('NOM',       sql.VarChar(50), nom)
      .input('PRENOM',    sql.VarChar(50), prenom)
      .input('CODE_S',    sql.VarChar(50), String(code_s))
      .query(`INSERT INTO [ONEP].[dbo].[PERSONNEL] (MATRICULE, NOM, PRENOM, CODE_S)
              VALUES (@MATRICULE, @NOM, @PRENOM, @CODE_S)`);

    res.json({ success: true, message: 'Personnel ajouté avec succès.' });
  } catch (err) {
    res.json({ success: false, message: err.message });
  } finally {
    await sql.close();
  }
});

// ══════════════════════════════════════
//  SERVICE
// ══════════════════════════════════════
app.get('/api/service', async (req, res) => {
  try {
    const pool   = await sql.connect(config);
    const result = await pool.request()
      .query('SELECT CODE_S, LIBELLE, CODE_D, SIGLE FROM [ONEP].[dbo].[SERVICE]');
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.json({ success: false, message: err.message });
  } finally {
    await sql.close();
  }
});

app.get('/api/service/:code_s', async (req, res) => {
  try {
    const pool   = await sql.connect(config);
    const result = await pool.request()
      .input('CODE_S', sql.VarChar(20), req.params.code_s)
      .query(`SELECT CODE_S, LIBELLE, CODE_D, SIGLE
              FROM [ONEP].[dbo].[SERVICE]
              WHERE CODE_S = @CODE_S`);

    if (result.recordset.length === 0)
      return res.json({ success: false, message: 'Service introuvable.' });

    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    res.json({ success: false, message: err.message });
  } finally {
    await sql.close();
  }
});
/// ══════════════════════════════════════
// DIVISION
// ══════════════════════════════════════
app.get('/api/division', async (req, res) => {
  try {
    const pool   = await sql.connect(config);
    const result = await pool.request()
      .query('SELECT CODE_D, LIBELLE FROM [ONEP].[dbo].[DIVISION]');
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.json({ success: false, message: err.message });
  } finally {
    await sql.close();
  }
});

app.get('/api/division/:code_d', async (req, res) => { // ✅ /api/division pas /api/service
  try {
    const pool   = await sql.connect(config);
    const result = await pool.request()
      .input('CODE_D', sql.VarChar(20), req.params.code_d) // ✅ code_d pas code_s
      .query(`SELECT CODE_D, LIBELLE
              FROM [ONEP].[dbo].[DIVISION]
              WHERE CODE_D = @CODE_D`);

    if (result.recordset.length === 0)
      return res.json({ success: false, message: 'Division introuvable.' });

    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    res.json({ success: false, message: err.message });
  } finally {
    await sql.close();
  }
});

// ══════════════════════════════════════
//  FOURNITURE
// ══════════════════════════════════════
app.get('/api/fourniture', async (req, res) => {
  try {
    const pool   = await sql.connect(config);
    const result = await pool.request()
      .query(`SELECT CODE_F, DESIGNATION, UNITE, QT_STOCK
              FROM [ONEP].[dbo].[FOURNITURE]`);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.json({ success: false, message: err.message });
  } finally {
    await sql.close();
  }
});

app.get('/api/fourniture/:id', async (req, res) => {
  try {
    const pool   = await sql.connect(config);
    const result = await pool.request()
      .input('CODE_F', sql.Int, parseInt(req.params.id))
      .query(`SELECT CODE_F, DESIGNATION, UNITE, QT_STOCK
              FROM [ONEP].[dbo].[FOURNITURE]
              WHERE CODE_F = @CODE_F`);

    if (result.recordset.length === 0)
      return res.json({ success: false, message: 'Fourniture introuvable.' });

    res.json({ success: true, data: result.recordset[0] });
  } catch (err) {
    res.json({ success: false, message: err.message });
  } finally {
    await sql.close();
  }
});

app.post('/api/fourniture', async (req, res) => {
  const { fourniture, unite, QTE } = req.body;

  if (!fourniture || !unite || !QTE) {
    return res.json({ success: false, message: 'Champs manquants.' });
  }

  try {
    const pool = await sql.connect(config);

    const maxResult = await pool.request()
      .query('SELECT ISNULL(MAX(CODE_F), 0) + 1 AS next_code FROM [ONEP].[dbo].[FOURNITURE]');
    const nextCode = maxResult.recordset[0].next_code;

    await pool.request()
      .input('CODE_F',      sql.Int,          nextCode)
      .input('DESIGNATION', sql.VarChar(100), fourniture)
      .input('UNITE',       sql.VarChar(20),  unite)
      .input('QT_STOCK',    sql.Int,          parseInt(QTE))
      .query(`INSERT INTO [ONEP].[dbo].[FOURNITURE] (CODE_F, DESIGNATION, UNITE, QT_STOCK)
              VALUES (@CODE_F, @DESIGNATION, @UNITE, @QT_STOCK)`);

    res.json({ success: true, message: 'Fourniture ajoutée.', code_f: nextCode });
  } catch (err) {
    res.json({ success: false, message: err.message });
  } finally {
    await sql.close();
  }
});

app.put('/api/fourniture/:id', async (req, res) => {
  const { fourniture, unite, QTE } = req.body;
  const id = parseInt(req.params.id);

  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input('CODE_F',      sql.Int,          id)
      .input('DESIGNATION', sql.VarChar(100), fourniture)
      .input('UNITE',       sql.VarChar(20),  unite)
      .input('QT_STOCK',    sql.Int,          parseInt(QTE))
      .query(`UPDATE [ONEP].[dbo].[FOURNITURE]
              SET DESIGNATION = @DESIGNATION,
                  UNITE       = @UNITE,
                  QT_STOCK    = @QT_STOCK
              WHERE CODE_F = @CODE_F`);

    res.json({ success: true, message: 'Fourniture modifiée.' });
  } catch (err) {
    res.json({ success: false, message: err.message });
  } finally {
    await sql.close();
  }
});

app.delete('/api/fourniture/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const pool = await sql.connect(config);

    await pool.request()
      .input('CODE_F', sql.Int, id)
      .query('DELETE FROM [ONEP].[dbo].[FOURNITURE] WHERE CODE_F = @CODE_F');

    const result = await pool.request()
      .query('SELECT CODE_F FROM [ONEP].[dbo].[FOURNITURE] ORDER BY CODE_F ASC');

    for (let i = 0; i < result.recordset.length; i++) {
      const oldCode = result.recordset[i].CODE_F;
      const newCode = i + 1;
      if (oldCode !== newCode) {
        await pool.request()
          .input('NEW_CODE', sql.Int, newCode)
          .input('OLD_CODE', sql.Int, oldCode)
          .query('UPDATE [ONEP].[dbo].[FOURNITURE] SET CODE_F = @NEW_CODE WHERE CODE_F = @OLD_CODE');
      }
    }

    res.json({ success: true, message: 'Fourniture supprimée et codes réorganisés.' });
  } catch (err) {
    res.json({ success: false, message: err.message });
  } finally {
    await sql.close();
  }
});

// ══════════════════════════════════════
//  ACQUISITION
// ══════════════════════════════════════
app.get('/api/acquisition', async (req, res) => {
  try {
    const pool   = await sql.connect(config);
    const result = await pool.request()
      .query(`
        SELECT
          a.NUM_MARCHE  AS NUM_MARCHE,
          a.DATE_MARCHE AS DATE_MARCHE,
          a.FOURNISSEUR AS FOURNISSEUR,
          a.CODE_F      AS CODE_F,
          f.DESIGNATION AS DESIGNATION,
          a.QTE         AS QTE
        FROM [ONEP].[dbo].[Acquisition] a
        LEFT JOIN [ONEP].[dbo].[FOURNITURE] f
          ON a.CODE_F = f.CODE_F
      `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.json({ success: false, message: err.message });
  } finally {
    await sql.close();
  }
});

app.post('/api/acquisition', async (req, res) => {
  const { num_marche, date_marche, fournisseur, code_f, qte } = req.body;

  if (!num_marche || !date_marche || !fournisseur || !code_f || !qte) {
    return res.json({ success: false, message: 'Champs manquants.' });
  }

  try {
    const pool = await sql.connect(config);

    const check = await pool.request()
      .input('CODE_F', sql.Int, parseInt(code_f))
      .query('SELECT CODE_F FROM [ONEP].[dbo].[FOURNITURE] WHERE CODE_F = @CODE_F');

    if (check.recordset.length === 0)
      return res.json({ success: false, message: `Fourniture ${code_f} introuvable.` });

    await pool.request()
      .input('NUM_MARCHE',  sql.Int,          parseInt(num_marche))
      .input('DATE_MARCHE', sql.Date,         new Date(date_marche))
      .input('FOURNISSEUR', sql.VarChar(100), fournisseur)
      .input('CODE_F',      sql.Int,          parseInt(code_f))
      .input('QTE',         sql.Int,          parseInt(qte))
      .query(`INSERT INTO [ONEP].[dbo].[Acquisition] (NUM_MARCHE, DATE_MARCHE, FOURNISSEUR, CODE_F, QTE)
              VALUES (@NUM_MARCHE, @DATE_MARCHE, @FOURNISSEUR, @CODE_F, @QTE)`);

    await pool.request()
      .input('QTE',    sql.Int, parseInt(qte))
      .input('CODE_F', sql.Int, parseInt(code_f))
      .query('UPDATE [ONEP].[dbo].[FOURNITURE] SET QT_STOCK = QT_STOCK + @QTE WHERE CODE_F = @CODE_F');

    res.json({ success: true, message: 'Acquisition enregistrée. Stock mis à jour.' });
  } catch (err) {
    res.json({ success: false, message: err.message });
  } finally {
    await sql.close();
  }
});

// ══════════════════════════════════════
//  DISTRIBUTION
// ══════════════════════════════════════
app.post('/api/distribution', async (req, res) => {
  const { matricule, code_f, date, qte, recuperePar, nom, prenom } = req.body;

  if (!matricule || !code_f || !date || !qte) {
    return res.json({ success: false, message: 'Champs manquants.' });
  }

  try {
    const pool = await sql.connect(config);

    const stock = await pool.request()
      .input('CODE_F', sql.Int, parseInt(code_f))
      .query('SELECT QT_STOCK FROM [ONEP].[dbo].[FOURNITURE] WHERE CODE_F = @CODE_F');

    if (stock.recordset.length === 0)
      return res.json({ success: false, message: 'Fourniture introuvable.' });

    if (stock.recordset[0].QT_STOCK <= 5)
      return res.json({ success: false, message: `Stock insuffisant. Disponible : ${stock.recordset[0].QT_STOCK}` });

    if (stock.recordset[0].QT_STOCK < parseInt(qte))
      return res.json({ success: false, message: `Stock insuffisant. Disponible : ${stock.recordset[0].QT_STOCK}` });

    // ✅ RECUPERE_PAR calculé uniquement depuis req.body
    const recupere_par = recuperate === 'delegue'
      ? recuperePar
      : `${nom || ''} ${prenom || ''}`.trim();

    await pool.request()
      .input('MATRICULE',         sql.Int,          parseInt(matricule))
      .input('CODE_F',            sql.Int,          parseInt(code_f))
      .input('DATE_RECUPERATION', sql.Date,         new Date(date))
      .input('QTE',               sql.Int,          parseInt(qte))
      .input('RECUPERE_PAR',      sql.VarChar(100), recupere_par)
      .query(`INSERT INTO [ONEP].[dbo].[DISTRIBUTION]
                (MATRICULE, CODE_F, DATE_RECUPERATION, QTE, RECUPERE_PAR)
              VALUES
                (@MATRICULE, @CODE_F, @DATE_RECUPERATION, @QTE, @RECUPERE_PAR)`);

    await pool.request()
      .input('QTE',    sql.Int, parseInt(qte))
      .input('CODE_F', sql.Int, parseInt(code_f))
      .query('UPDATE [ONEP].[dbo].[FOURNITURE] SET QT_STOCK = QT_STOCK - @QTE WHERE CODE_F = @CODE_F');

    res.json({ success: true, message: 'Distribution enregistrée. Stock mis à jour.' });
  } catch (err) {
    res.json({ success: false, message: err.message });
  } finally {
    await sql.close();
  }
});

// ══════════════════════════════════════
//  PDF
// ══════════════════════════════════════
app.post('/api/distribution/pdf', async (req, res) => {
  const { matricule, code_f, date, qte, recuperate, recuperePar,
          nom, prenom, fourniture, unite } = req.body;

  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=distribution_${matricule}_${date}.pdf`);

  doc.pipe(res);

  doc.fontSize(20).font('Helvetica-Bold').text('ONEP', { align: 'center' });
  doc.fontSize(13).font('Helvetica').text("Office National de l'Eau Potable", { align: 'center' });
  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown();
  doc.fontSize(16).font('Helvetica-Bold').text('Bon de Distribution Fourniture', { align: 'center' });
  doc.moveDown(1.5);

  doc.fontSize(13).font('Helvetica-Bold').text('Informations Personnel');
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica');
  doc.text(`Matricule   : ${matricule}`);
  doc.text(`Nom         : ${nom || '—'}`);
  doc.text(`Prénom      : ${prenom || '—'}`);
  doc.moveDown();

  doc.fontSize(13).font('Helvetica-Bold').text('Informations Fourniture');
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica');
  doc.text(`Code        : ${code_f}`);
  doc.text(`Désignation : ${fourniture || '—'}`);
  doc.text(`Unité       : ${unite || '—'}`);
  doc.text(`Quantité    : ${qte}`);
  doc.moveDown();

  doc.fontSize(13).font('Helvetica-Bold').text('Détails Distribution');
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica');
  doc.text(`Date        : ${date}`);
  doc.text(`Récupéré par: ${recuperate === 'delegue' ? recuperePar : 'Lui Même'}`);
  doc.moveDown(2);

  doc.text('Signature Employé',      50,  doc.y, { width: 200, align: 'center' });
  doc.text('Signature Responsable', 350,  doc.y - doc.currentLineHeight(), { width: 200, align: 'center' });
  doc.moveDown(3);
  doc.moveTo(50,  doc.y).lineTo(200, doc.y).stroke();
  doc.moveTo(350, doc.y).lineTo(500, doc.y).stroke();
  doc.moveDown(2);
  doc.fontSize(9).fillColor('gray')
    .text(`Document généré le ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });

  doc.end();
});

// ══════════════════════════════════════
//  STATIC + START
// ══════════════════════════════════════
app.get('/listes', (req, res) => {
  res.sendFile(path.join(__dirname, 'listes.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.static(path.join(__dirname)));

app.listen(3000, () => {
  console.log('Serveur démarré → http://localhost:3000');
});