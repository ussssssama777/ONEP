document.addEventListener('DOMContentLoaded', function () {

  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function (e) {
      if (e.target === this) this.classList.remove('open');
    });
  });

  loadFournitures();
});

// ══════════════════════════════════════
//  SWITCH TABLE
// ══════════════════════════════════════
function switchTable(name) {
  ['fourniture', 'personnel', 'acquisitions'].forEach(n => {
    document.getElementById('section-' + n).style.display = 'none';
    document.getElementById('btn-' + n).classList.remove('active');
  });

  document.getElementById('section-' + name).style.display = 'block';
  document.getElementById('btn-' + name).classList.add('active');

  if (name === 'fourniture') loadFournitures();
  if (name === 'personnel')  loadPersonnel();
  if (name === 'acquisitions') loadAcquisitions();
}

// ══════════════════════════════════════
//  FOURNITURE
// ══════════════════════════════════════
async function loadFournitures() {
  try {
    const res   = await fetch('/api/fourniture');
    const data  = await res.json();

    const tbody = document.getElementById('fourniture-tbody');
    if (!tbody) {
      console.error('fourniture-tbody introuvable');
      return;
    }
    tbody.innerHTML = '';

    if (!data.data || data.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94a3b8">Aucune fourniture.</td></tr>';
      return;
    }

    data.data.forEach(f => {
  const row = document.createElement('tr');
  const stockStyle = f.QT_STOCK <= 5
    ? 'color:red; font-weight:bold;'
    : 'color:green; font-weight:bold;';

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
//  PERSONNEL
// ══════════════════════════════════════
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
          <td>
            <button class="btn-delete" onclick="deletePersonnel(${p.MATRICULE})">Supprimer</button>
          </td>
        </tr>`;
    });
  } catch (err) {
    console.error('Erreur chargement personnel :', err);
  }
}
async function deletePersonnel(id) {
  if (!confirm('Supprimer ce personnel ?')) return;

  try {
    const res  = await fetch('/api/personel/' + id, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      loadPersonnel();
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
async function loadAcquisitions() {
  try {
    const res   = await fetch('/api/acquisition');
    const data  = await res.json();
    const tbody = document.getElementById('acquisitions-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!data.data || data.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94a3b8">Aucune acquisition.</td></tr>';
      return;
    }

    data.data.forEach(d => {
      const DATE = new Date(d.DATE_MARCHE).toLocaleDateString();
      tbody.innerHTML += `
        <tr>
          <td>${d.NUM_MARCHE}</td>
          <td>${DATE}</td>
          <td>${d.FOURNISSEUR || '—'}</td>
          <td>${d.CODE_F}</td>
          <td>${d.QTE}</td>
         
    </tr>`;
    });
  } catch (err) {
    console.error('Erreur chargement acquisitions :', err);
  }
}