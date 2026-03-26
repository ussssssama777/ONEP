document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function (e) {
      if (e.target === this) this.classList.remove('open');
    });
  });
});

// ══════════════════════════════════════
//  PERSONNEL
// ══════════════════════════════════════
function openModalPersonnel() {
  document.getElementById('modalPersonnel').classList.add('open');
}

function closeModalPersonnel() {
  document.getElementById('modalPersonnel').classList.remove('open');
}

async function addPersonnel() {
  const matricule = document.getElementById('matricule').value.trim();
  const nom       = document.getElementById('nom').value.trim();
  const prenom    = document.getElementById('prenom').value.trim();
  const code_s    = document.getElementById('code_s').value.trim();

  if (!matricule || !nom || !prenom || !code_s) {
    alert('Veuillez remplir tous les champs.');
    return;
  }

  try {
    const res  = await fetch('/api/personel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matricule, nom, prenom, code_s })
    });
    const data = await res.json();

    if (data.success) {
      closeModalPersonnel();
      ['matricule', 'nom', 'prenom', 'code_s'].forEach(id => {
        document.getElementById(id).value = '';
      });
      loadPersonnel();
    } else {
      alert('Erreur : ' + data.message);
    }
  } catch (err) {
    alert('Erreur réseau : ' + err);
  }
}

async function loadPersonnel() {
  try {
    const res   = await fetch('/api/personel');
    const data  = await res.json();
    const tbody = document.getElementById('personel-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!data.data || data.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94a3b8">Aucun personnel.</td></tr>';
      return;
    }

    data.data.forEach(p => {
      tbody.innerHTML += `
        <tr>
          <td>${p.MATRICULE}</td>
          <td>${p.NOM}</td>
          <td>${p.PRENOM}</td>
          <td>${p.CODE_S}</td>
          <td>${p.LIBELLE || '—'}</td>
        </tr>`;
    });
  } catch (err) {
    console.error('Erreur chargement personnel :', err);
  }
}

async function fetchPersonnel(matricule) {
  ['p_matricule', 'p_nom', 'p_prenom', 'p_code_s', 'p_libelle', 'p_service'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  if (!matricule) return;

  try {
    const res  = await fetch('/api/personel/' + matricule);
    const data = await res.json();

    if (data.success) {
      document.getElementById('p_matricule').value = data.data.MATRICULE;
      document.getElementById('p_nom').value       = data.data.NOM;
      document.getElementById('p_prenom').value    = data.data.PRENOM;
      document.getElementById('p_code_s').value    = data.data.CODE_S;
      document.getElementById('p_libelle').value   = data.data.LIBELLE  || '—';
      document.getElementById('p_service').value   = data.data.DIVISION || '—';
    } else {
      document.getElementById('p_nom').value = 'Introuvable';
    }
  } catch (err) {
    console.error('Erreur fetch personnel :', err);
  }
}

// ══════════════════════════════════════
//  SERVICE
// ══════════════════════════════════════
async function fetchService(code_s) {
  if (!code_s) return;
  try {
    const res  = await fetch('/api/service/' + code_s);
    const data = await res.json();
    if (!data.success) {
      console.warn('Service introuvable pour code_s =', code_s);
    }
  } catch (err) {
    console.error('Erreur fetch service :', err);
  }
}

// ══════════════════════════════════════
//  FOURNITURE
// ══════════════════════════════════════
function openModalFourniture() {
  document.getElementById('modalFourniture').classList.add('open');
}

function closeModalFourniture() {
  document.getElementById('modalFourniture').classList.remove('open');
}

async function addFourniture() {
  const fourniture = document.getElementById('fourniture').value.trim();
  const unite      = document.getElementById('unite').value.trim();
  const QTE        = document.getElementById('QTE').value.trim();

  if (!fourniture || !unite || !QTE) {
    alert('Veuillez remplir tous les champs.');
    return;
  }

  try {
    const res  = await fetch('/api/fourniture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fourniture, unite, QTE })
    });
    const data = await res.json();

    if (data.success) {
      closeModalFourniture();
      ['fourniture', 'unite', 'QTE'].forEach(id => {
        document.getElementById(id).value = '';
      });
      loadFournitures();
    } else {
      alert('Erreur : ' + data.message);
    }
  } catch (err) {
    alert('Erreur réseau : ' + err);
  }
}

async function fetchFourniture(id) {
  ['f_code_f', 'f_designation', 'f_unite', 'f_qt_stock'].forEach(i => {
    const el = document.getElementById(i);
    if (el) {
      el.value = '';
      el.style.color      = '';
      el.style.fontWeight = '';
      el.style.background = '';
    }
  });

  if (!id) return;

  try {
    const res  = await fetch('/api/fourniture/' + id);
    const data = await res.json();

    if (data.success) {
      document.getElementById('f_code_f').value      = data.data.CODE_F;
      document.getElementById('f_designation').value = data.data.DESIGNATION;
      document.getElementById('f_unite').value       = data.data.UNITE;
      document.getElementById('f_qt_stock').value    = data.data.QT_STOCK;

      if (data.data.QT_STOCK <= 5) {
        const el = document.getElementById('f_qt_stock');
        el.style.color      = 'red';
        el.style.fontWeight = 'bold';
        el.style.background = '#fff0f0';
      }
    } else {
      document.getElementById('f_designation').value = 'Introuvable';
    }
  } catch (err) {
    console.error('Erreur fetch fourniture :', err);
  }
}

async function loadFournitures() {
  try {
    const res   = await fetch('/api/fourniture');
    const data  = await res.json();
    const tbody = document.getElementById('fourniture-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!data.data || data.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94a3b8">Aucune fourniture.</td></tr>';
      return;
    }

    data.data.forEach(f => {
      const row = document.createElement('tr');
      const stockStyle = f.QT_STOCK <= 5
        ? 'color:red; font-weight:bold; background:#fff0f0;'
        : '';

      row.innerHTML = `
        <td>${f.CODE_F}</td>
        <td>${f.DESIGNATION}</td>
        <td>${f.UNITE || '—'}</td>
        <td style="${stockStyle}">${f.QT_STOCK}</td>
        <td>
          <button class="btn-edit">Modifier</button>
          <button class="btn-delete">Supprimer</button>
        </td>`;

      row.querySelector('.btn-edit').addEventListener('click', () => {
        openModalUpdateFourniture(f.CODE_F, f.DESIGNATION, f.UNITE || '', f.QT_STOCK);
      });

      row.querySelector('.btn-delete').addEventListener('click', () => {
        deleteFourniture(f.CODE_F);
      });

      tbody.appendChild(row);
    });
  } catch (err) {
    console.error('Erreur chargement fournitures :', err);
  }
}

function openModalUpdateFourniture(id, fourniture, unite, QTE) {
  document.getElementById('update_id').value         = id;
  document.getElementById('update_fourniture').value = fourniture;
  document.getElementById('update_unite').value      = unite;
  document.getElementById('update_QTE').value        = QTE;
  document.getElementById('modalUpdateFourniture').classList.add('open');
}

function closeModalUpdateFourniture() {
  document.getElementById('modalUpdateFourniture').classList.remove('open');
}

async function updateFourniture() {
  const id         = document.getElementById('update_id').value;
  const fourniture = document.getElementById('update_fourniture').value.trim();
  const unite      = document.getElementById('update_unite').value.trim();
  const QTE        = document.getElementById('update_QTE').value.trim();

  if (!fourniture || !unite || !QTE) {
    alert('Veuillez remplir tous les champs.');
    return;
  }

  try {
    const res  = await fetch('/api/fourniture/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fourniture, unite, QTE })
    });
    const data = await res.json();

    if (data.success) {
      closeModalUpdateFourniture();
      loadFournitures();
    } else {
      alert('Erreur : ' + data.message);
    }
  } catch (err) {
    alert('Erreur réseau : ' + err);
  }
}

async function deleteFourniture(id) {
  if (!confirm('Supprimer cette fourniture ?')) return;

  try {
    const res  = await fetch('/api/fourniture/' + id, { method: 'DELETE' });
    const data = await res.json();

    if (data.success) {
      loadFournitures();
    } else {
      alert('Erreur : ' + data.message);
    }
  } catch (err) {
    alert('Erreur réseau : ' + err);
  }
}

// ══════════════════════════════════════
//  ACQUISITION
// ══════════════════════════════════════
function openModalAcquisition() {
  document.getElementById('modalAcquisition').classList.add('open');
}

function closeModalAcquisition() {
  document.getElementById('modalAcquisition').classList.remove('open');
}

async function fetchFournitureAcq(id) {
  document.getElementById('acq_designation').value = '';
  if (!id) return;

  try {
    const res  = await fetch('/api/fourniture/' + id);
    const data = await res.json();

    if (data.success) {
      document.getElementById('acq_designation').value = data.data.DESIGNATION;
    } else {
      document.getElementById('acq_designation').value = 'Introuvable';
    }
  } catch (err) {
    console.error('Erreur fetch fourniture acq :', err);
  }
}

async function addAcquisition() {
  const num_marche  = document.getElementById('acq_num_marche').value.trim();
  const date_marche = document.getElementById('acq_date_marche').value;
  const fournisseur = document.getElementById('acq_fournisseur').value.trim();
  const code_f      = document.getElementById('acq_code_f').value.trim();
  const qte         = document.getElementById('acq_qte').value.trim();

  if (!num_marche || !date_marche || !fournisseur || !code_f || !qte) {
    alert('Veuillez remplir tous les champs.');
    return;
  }

  try {
    const res  = await fetch('/api/acquisition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ num_marche, date_marche, fournisseur, code_f, qte })
    });
    const data = await res.json();

    if (data.success) {
      alert('Acquisition ajoutée. Stock mis à jour.');
      closeModalAcquisition();
      ['acq_num_marche', 'acq_date_marche', 'acq_fournisseur',
       'acq_code_f', 'acq_designation', 'acq_qte'].forEach(id => {
        document.getElementById(id).value = '';
      });
      loadFournitures();
    } else {
      alert('Erreur : ' + data.message);
    }
  } catch (err) {
    alert('Erreur réseau : ' + err);
  }
}

// ══════════════════════════════════════
//  LISTES
// ══════════════════════════════════════
function showListes() {
  const sectionListes = document.getElementById('section-listes');

  if (sectionListes.style.display === 'block') {
    sectionListes.style.display = 'none';
    document.getElementById('section-fourniture').style.display = 'none';
    document.getElementById('section-personnel').style.display  = 'none';
    document.getElementById('btn-fourniture').classList.remove('active');
    document.getElementById('btn-personnel').classList.remove('active');
  } else {
    sectionListes.style.display = 'block';
  }
}

function switchTable(name) {
  document.getElementById('section-fourniture').style.display = 'none';
  document.getElementById('section-personnel').style.display  = 'none';
  document.getElementById('btn-fourniture').classList.remove('active');
  document.getElementById('btn-personnel').classList.remove('active');

  const section = document.getElementById('section-' + name);
  const btn     = document.getElementById('btn-' + name);

  if (section.style.display === 'block') {
    section.style.display = 'none';
    btn.classList.remove('active');
  } else {
    section.style.display = 'block';
    btn.classList.add('active');
    if (name === 'fourniture') loadFournitures();
    if (name === 'personnel')  loadPersonnel();
  }
}

// ══════════════════════════════════════
//  DISTRIBUTION
// ══════════════════════════════════════
async function addDistribution() {
  const matricule   = document.getElementById('dist_matricule').value.trim();
  const code_f      = document.getElementById('dist_code_f').value.trim();
  const date        = document.getElementById('dist_date').value;
  const qte         = document.getElementById('dist_qte').value.trim();
  const recuperate  = document.getElementById('recuperate').value;
  const recuperePar = document.getElementById('recuperePar').value.trim();

  const nom        = document.getElementById('p_nom').value;
  const prenom     = document.getElementById('p_prenom').value;
  const service    = document.getElementById('p_libelle').value;
  const division   = document.getElementById('p_service').value;
  const fourniture = document.getElementById('f_designation').value;
  const unite      = document.getElementById('f_unite').value;
  const qtStock    = parseInt(document.getElementById('f_qt_stock').value);

  if (!matricule || !code_f || !date || !qte) {
    alert('Veuillez remplir tous les champs obligatoires.');
    return;
  }

  if (recuperate === 'delegue' && !recuperePar) {
    alert('Veuillez saisir le nom du délégué.');
    return;
  }

  if (qtStock <= 5) {
    alert(`Stock insuffisant (${qtStock}). Distribution impossible.`);
    return;
  }

  try {
    // ✅ 1. Enregistrer la distribution
    const res  = await fetch('/api/distribution', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matricule, code_f, date, qte, recuperate, recuperePar, nom, prenom })
    });
    const data = await res.json();

    if (!data.success) {
      alert('Erreur : ' + data.message);
      return;
    }

    // ✅ 2. Générer le PDF
    const pdfRes = await fetch('/api/distribution/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matricule, nom, prenom, service, division,
        code_f, fourniture, unite, qte, date,
        recuperate, recuperePar
      })
    });

    const blob = await pdfRes.blob();
    const url  = window.URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `decharge_${matricule}_${date}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);

    // ✅ 3. Reset tous les champs
    ['dist_matricule', 'dist_code_f', 'dist_date', 'dist_qte', 'recuperePar',
     'p_matricule', 'p_nom', 'p_prenom', 'p_code_s', 'p_libelle', 'p_service',
     'f_code_f', 'f_designation', 'f_unite', 'f_qt_stock'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.value            = '';
        el.style.color      = '';
        el.style.fontWeight = '';
        el.style.background = '';
      }
    });

    document.getElementById('recuperate').value     = 'lui-meme';
    document.getElementById('recuperePar').disabled = true;
    loadFournitures();

  } catch (err) {
    alert('Erreur réseau : ' + err);
  }
}

// ══════════════════════════════════════
//  TOGGLE RÉCUPÉRÉ PAR
// ══════════════════════════════════════
function toggleRecupere(select) {
  const input = document.getElementById('recuperePar');
  if (select.value === 'delegue') {
    input.disabled = false;
    input.focus();
  } else {
    input.disabled = true;
    input.value = '';
  }
}