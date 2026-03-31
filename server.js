const express = require('express');
const sql     = require('mssql');
const config  = require('./dbconfig');
const path    = require('path');
const PDFDocument = require('pdfkit');
const app     = express();

app.use(express.json());

// Dossier statique
app.use(express.static(path.join(__dirname, 'public')));

// Route pour user.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'user.html'));
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
// ══════════════════════════════════════
// USER LOGIN
// ══════════════════════════════════════
app.post('/api/login', async (req, res) => {

  const { username, password } = req.body;

  if (!username || !password)
    return res.json({ success: false, message: 'Champs manquants' });

  try {

    const pool = await sql.connect(config);

    const result = await pool.request()
      .input('USERNAME', sql.VarChar, username)
      .input('PASSWORD', sql.VarChar, password)
      .query(`
        SELECT * FROM USERS
        WHERE USERNAME = @USERNAME AND PASSWORD = @PASSWORD
      `);

    if (result.recordset.length === 0)
      return res.json({ success: false, message: 'Utilisateur incorrect' });

    res.json({
      success: true,
      user: result.recordset[0]
    });

  } catch (err) {
    res.json({ success: false, message: err.message });
  }

});

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
          (SELECT LIBELLE FROM [ONEP].[dbo].[SERVICE]  WHERE CODE_S = p.CODE_S) AS LIBELLE,
          (SELECT LIBELLE FROM [ONEP].[dbo].[DIVISION] WHERE CODE_D =
            (SELECT CODE_D FROM [ONEP].[dbo].[SERVICE] WHERE CODE_S = p.CODE_S)) AS DIVISION
        FROM [ONEP].[dbo].[PERSONNEL] p
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

// ══════════════════════════════════════
//  DIVISION
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

app.get('/api/division/:code_d', async (req, res) => {
  try {
    const pool   = await sql.connect(config);
    const result = await pool.request()
      .input('CODE_D', sql.VarChar(20), req.params.code_d)
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

//  DELETE PERSONNEL
app.delete('/api/personel/:matricule', async (req, res) => {
  const matricule = parseInt(req.params.matricule);

  try {
    const pool = await sql.connect(config);

    // Vérifier si le personnel existe
    const check = await pool.request()
      .input('MATRICULE', sql.Int, matricule)
      .query(`SELECT MATRICULE FROM [ONEP].[dbo].[PERSONNEL] WHERE MATRICULE = @MATRICULE`);

    if (check.recordset.length === 0)
      return res.json({ success: false, message: 'Personnel introuvable.' });

    // Supprimer
    await pool.request()
      .input('MATRICULE', sql.Int, matricule)
      .query(`DELETE FROM [ONEP].[dbo].[PERSONNEL] WHERE MATRICULE = @MATRICULE`);

    res.json({ success: true, message: 'Personnel supprimé.' });

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
  const { matricule, code_f, date, qte, recuperate, recuperePar, nom, prenom } = req.body;

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

    // RECUPERE_PAR = nom+prenom si lui-même, sinon le délégué
    const recupere_par = recuperate === 'delegue'
      ? (recuperePar || '—')
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

app.get('/api/distribution', async (req, res) => {
  try {
    const pool   = await sql.connect(config);
    const result = await pool.request()
      .query(`
        SELECT
          ID_DISTRIBUTION,
          MATRICULE,
          CODE_F,
          DESIGNATION,
          DATE_RECUPERATION,
          QTE,
          RECUPERE_PAR
        FROM [ONEP].[dbo].[DISTRIBUTION]
      `);
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    res.json({ success: false, message: err.message });
  } finally {
    await sql.close();
  }
});

//------------------------//  EDITION DISTRIBUTION  //------------------------//
// PUT modifier distribution
app.put('/api/distribution/:id', async (req, res) => {
  const { date, qte, recuperate, recuperePar, nom, prenom, code_f } = req.body;
  const id       = parseInt(req.params.id);
  const newQte   = parseInt(qte);
  const newCodeF = parseInt(code_f);

  const recupere_par = recuperate === 'delegue'
    ? (recuperePar || '—')
    : `${nom || ''} ${prenom || ''}`.trim();

  try {
    const pool = await sql.connect(config);

    // 1️⃣ Récupérer ancienne distribution
    const old = await pool.request()
      .input('ID_DISTRIBUTION', sql.Int, id)
      .query(`SELECT CODE_F, QTE FROM [ONEP].[dbo].[DISTRIBUTION] WHERE ID_DISTRIBUTION = @ID_DISTRIBUTION`);

    if (old.recordset.length === 0)
      return res.json({ success: false, message: 'Distribution introuvable.' });

    const oldQte   = old.recordset[0].QTE;
    const oldCodeF = old.recordset[0].CODE_F;

    // 2️⃣ Récupérer DESIGNATION du nouveau CODE_F
    const fCheck = await pool.request()
      .input('CODE_F', sql.Int, newCodeF)
      .query(`SELECT QT_STOCK, DESIGNATION FROM [ONEP].[dbo].[FOURNITURE] WHERE CODE_F = @CODE_F`);

    if (fCheck.recordset.length === 0)
      return res.json({ success: false, message: 'Fourniture introuvable.' });

    const newDesignation = fCheck.recordset[0].DESIGNATION;
    const stockDispo     = fCheck.recordset[0].QT_STOCK + (oldCodeF === newCodeF ? oldQte : 0);

    if (stockDispo < newQte)
      return res.json({ success: false, message: `Stock insuffisant. Disponible : ${stockDispo}` });

    // 3️⃣ Restaurer ancien stock si CODE_F change
    if (oldCodeF !== newCodeF) {
      await pool.request()
        .input('OLD_QTE',    sql.Int, oldQte)
        .input('OLD_CODE_F', sql.Int, oldCodeF)
        .query(`UPDATE [ONEP].[dbo].[FOURNITURE] SET QT_STOCK = QT_STOCK + @OLD_QTE WHERE CODE_F = @OLD_CODE_F`);
    }

    // 4️⃣ Mettre à jour distribution avec CODE_F + DESIGNATION
    await pool.request()
      .input('ID_DISTRIBUTION',   sql.Int,          id)
      .input('DATE_RECUPERATION', sql.Date,         new Date(date))
      .input('QTE',               sql.Int,          newQte)
      .input('RECUPERE_PAR',      sql.VarChar(100), recupere_par)
      .input('CODE_F',            sql.Int,          newCodeF)
      .input('DESIGNATION',       sql.VarChar(200), newDesignation) // ✅
      .query(`
        UPDATE [ONEP].[dbo].[DISTRIBUTION]
        SET DATE_RECUPERATION = @DATE_RECUPERATION,
            QTE               = @QTE,
            RECUPERE_PAR      = @RECUPERE_PAR,
            CODE_F            = @CODE_F,
            DESIGNATION       = @DESIGNATION
        WHERE ID_DISTRIBUTION  = @ID_DISTRIBUTION
      `);

    // 5️⃣ Déduire nouveau stock
    await pool.request()
      .input('NEW_QTE',    sql.Int, newQte)
      .input('NEW_CODE_F', sql.Int, newCodeF)
      .query(`UPDATE [ONEP].[dbo].[FOURNITURE] SET QT_STOCK = QT_STOCK - @NEW_QTE WHERE CODE_F = @NEW_CODE_F`);

    res.json({ success: true, message: 'Distribution modifiée.' });

  } catch (err) {
    res.json({ success: false, message: err.message });
  } finally {
    await sql.close();
  }
});

// DELETE distribution
app.delete('/api/distribution/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const pool = await sql.connect(config);

    // 1. Récupérer QTE et CODE_F
    const dist = await pool.request()
      .input('ID_DISTRIBUTION', sql.Int, id)
      .query(`
        SELECT CODE_F, QTE
        FROM [ONEP].[dbo].[DISTRIBUTION]
        WHERE ID_DISTRIBUTION = @ID_DISTRIBUTION
      `);

    if (dist.recordset.length === 0)
      return res.json({ success: false, message: 'Distribution introuvable.' });

    const { CODE_F, QTE } = dist.recordset[0];

    // 2. Supprimer la distribution
    await pool.request()
      .input('ID_DISTRIBUTION', sql.Int, id)
      .query(`
        DELETE FROM [ONEP].[dbo].[DISTRIBUTION]
        WHERE ID_DISTRIBUTION = @ID_DISTRIBUTION
      `);

    // 3. Remettre le stock
    await pool.request()
      .input('QTE', sql.Int, QTE)
      .input('CODE_F', sql.Int, CODE_F)
      .query(`
        UPDATE [ONEP].[dbo].[FOURNITURE]
        SET QT_STOCK = QT_STOCK + @QTE
        WHERE CODE_F = @CODE_F
      `);

    res.json({ success: true, message: 'Distribution supprimée. Stock remis à jour.' });

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
  try {
    const {
      matricule, code_f, date, qte, recuperate, recuperePar,
      nom, prenom, fourniture, service, division, unite
    } = req.body;

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Decharge_${nom || ''}_${prenom || ''}_${matricule}.pdf`);

    doc.pipe(res);

    const pageW = doc.page.width;   // 595
    const pageH = doc.page.height;  // 842
    const margin = 50;

    

    // ══════════════════════════════════════
    // HEADER
    // ══════════════════════════════════════
    doc.fontSize(14).font('Helvetica-Bold').text('ONEE',        margin, margin + 5);
    doc.fontSize(12).font('Helvetica-Bold').text('BRANCHE EAU', margin, margin + 25);
    doc.fontSize(10).font('Helvetica').text('DR4/F',            margin, margin + 45);

    // ✅ DECHARGE en dessous de DR4/F
    doc.fontSize(22).font('Helvetica-Bold')
    .text('DECHARGE', margin, margin + 70, { width: pageW - margin * 2, align: 'center', underline: true });

    // Ligne séparatrice header ✅ décalée aussi
    const headerLineY = margin + 100;
    doc.moveTo(margin - 10, headerLineY).lineTo(pageW - margin + 10, headerLineY).stroke();

    // ══════════════════════════════════════
    // INFOS PERSONNEL
    // ══════════════════════════════════════
    const infoY = headerLineY + 40;
    doc.fontSize(11).font('Helvetica');

    doc.font('Helvetica-Bold').text('Nom et Prénom :', margin, infoY, { continued: true });
    doc.font('Helvetica').text(`  ${nom || '—'} ${prenom || '—'}`);

    doc.font('Helvetica-Bold').text('Je soussigné Mr/Mlle/Mme, Matricule :', margin, infoY + 22, { continued: true });
    doc.font('Helvetica').text(`  ${matricule}`);

    doc.font('Helvetica-Bold').text('Du Service/Centre :', margin, infoY + 44, { continued: true });
    doc.font('Helvetica').text(`  ${service || '—'}`);

    doc.font('Helvetica-Bold').text('relevant de la Division/Secteur :', margin, infoY + 66, { continued: true });
    doc.font('Helvetica').text(`  ${division || '—'}`);

    // ✅ Après Division sur une nouvelle ligne
    doc.font('Helvetica-Bold').text('Avoir reçu la(les) fournitures informatiques indiquées ci-dessous :', margin, infoY + 88);

    // Ligne séparatrice ✅ décalée
    const sepY = infoY + 112;
    doc.moveTo(margin - 10, sepY).lineTo(pageW - margin + 10, sepY).stroke();

    // ══════════════════════════════════════
    // TABLEAU
    // ══════════════════════════════════════
    const tableTop = sepY + 70;
    const col1 = margin;        const col1W = 60;
    const col2 = margin + 60;   const col2W = 260;  // ✅ réduit de 280 à 260
    const col3 = margin + 320;  const col3W = 70;   // ✅ décalé
    const col4 = margin + 390;  const col4W = 65;   // ✅ décalé

    const drawRow = (y, h) => {
    doc.rect(col1, y, col1W, h).stroke();
    doc.rect(col2, y, col2W, h).stroke();
    doc.rect(col3, y, col3W, h).stroke();
    doc.rect(col4, y, col4W, h).stroke();
    };

    // En-tête tableau
    const thH = 25;
    doc.font('Helvetica-Bold').fontSize(10);
    drawRow(tableTop, thH);
    doc.text('Code',        col1,     tableTop + 7, { width: col1W, align: 'center' });
    doc.text('Désignation', col2 + 5, tableTop + 7);
    doc.text('Unité',       col3,     tableTop + 7, { width: col3W, align: 'center' });
    doc.text('Quantité',    col4,     tableTop + 7, { width: col4W, align: 'center' }); // ✅

    // Ligne de données
    const tdH = 35;
    const rowY = tableTop + thH;
    doc.font('Helvetica').fontSize(10);
    drawRow(rowY, tdH);
    doc.text(`${code_f}`,            col1,     rowY + 10, { width: col1W,      align: 'center' });
    doc.text(`${fourniture || '—'}`,  col2 + 5, rowY + 10, { width: col2W - 10 });
    doc.text(`${unite || 'U'}`,       col3,     rowY + 10, { width: col3W,      align: 'center' });
    doc.text(`${qte}`,                col4,     rowY + 10, { width: col4W,      align: 'center' }); // ✅

    // ══════════════════════════════════════
    // DATE & RÉCUPÉRÉ PAR
    // ══════════════════════════════════════
    const recuperePar_text = recuperate === 'delegue'
      ? `${recuperePar || '—'}`
      : `${nom || '—'} ${prenom || '—'}`;

    const dateY = rowY + tdH + 30;
    doc.font('Helvetica').fontSize(11);
    doc.font('Helvetica-Bold').text('Date :',          margin,       dateY, { continued: true });
    doc.font('Helvetica').text(`  ${date}`);
    doc.font('Helvetica-Bold').text('Récupéré par :', margin + 250, dateY, { continued: true });
    doc.font('Helvetica').text(`  ${recuperePar_text}`);

    // ══════════════════════════════════════
    // SIGNATURES
    // ══════════════════════════════════════
// Position verticale : milieu de la page
    const sigLabelY = pageH / 2 + 80;   // ⬅️ change +40 to +20 or 0 if you want it higher
    const sigLineY  = sigLabelY + 30;

    // Centrage horizontal
    const sigWidth  = 200;
    const sigCenterX = (pageW - sigWidth) / 2;

    // Texte
    doc.font('Helvetica-Bold').fontSize(11);
    doc.text("Signature de l'intéressé", sigCenterX, sigLabelY, {
      width: sigWidth,
      align: 'center'
    });
    // ══════════════════════════════════════
    // FOOTER
    // ══════════════════════════════════════
    const footerY = pageH - margin - 15;
    doc.fontSize(8).font('Helvetica').fillColor('gray')
      .text(`Document généré le ${new Date().toLocaleDateString('fr-FR')}`,
            margin, footerY, { width: pageW - margin * 2, align: 'center' });

    doc.end();

  } catch (err) {
    console.error('ERREUR PDF :', err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
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