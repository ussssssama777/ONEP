document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function (e) {
      if (e.target === this) this.classList.remove('open');
    });
  });

  loadDistributions();
});

// ══════════════════════════════════════
//  LOAD DISTRIBUTIONS
// ══════════════════════════════════════
async function loadDistributions() {
  try {
    const res   = await fetch('/api/distribution');
    const data  = await res.json();
    const tbody = document.getElementById('distribution-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!data.data || data.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#94a3b8">Aucune distribution.</td></tr>';
      return;
    }

    data.data.forEach(d => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${d.MATRICULE}</td>
        <td>${d.CODE_F}</td>
        <td>${d.DESIGNATION || '—'}</td>
        <td>${d.DATE_RECUPERATION ? new Date(d.DATE_RECUPERATION).toLocaleDateString('fr-FR') : '—'}</td>
        <td>${d.QTE}</td>
        <td>${d.RECUPERE_PAR || '—'}</td>
        <td>
          <button class="btn-edit">Modifier</button>
          <button class="btn-delete">Supprimer</button>
        </td>`;

      row.querySelector('.btn-edit').addEventListener('click', () => {
        openModalEditDistribution(d);
      });

      row.querySelector('.btn-delete').addEventListener('click', () => {
        deleteDistribution(d.ID_DISTRIBUTION);
      });

      tbody.appendChild(row);
    });

  } catch (err) {
    console.error('Erreur chargement distributions :', err);
  }
}

// ══════════════════════════════════════
//  MODAL MODIFIER
// ══════════════════════════════════════
function openModalEditDistribution(d) {
  document.getElementById('edit_id').value          = d.ID_DISTRIBUTION;
  document.getElementById('edit_matricule').value   = d.MATRICULE;
  document.getElementById('edit_code_f').value      = d.CODE_F;
  document.getElementById('edit_designation').value = d.DESIGNATION || '—';
  document.getElementById('edit_date').value        = d.DATE_RECUPERATION
    ? new Date(d.DATE_RECUPERATION).toISOString().split('T')[0]
    : '';
  document.getElementById('edit_qte').value        = d.QTE;

  // ✅ Détecter si récupéré par délégué
  const select = document.getElementById('edit_recuperate');
  const input  = document.getElementById('edit_recuperePar');

  select.value = 'lui-meme';
  input.value    = '';
  input.disabled = true;

  // ✅ Appeler toggleRecupereEdit pour activer le champ si besoin
  toggleRecupereEdit(select);

  document.getElementById('modalEditDistribution').classList.add('open');
}

function toggleRecupereEdit(select) {
  const input = document.getElementById('edit_recuperePar');
  if (select.value === 'delegue') {
    input.disabled = false; // ✅ activer
    input.focus();
  } else {
    input.disabled = true;
    input.value = '';
  }
}
// ══════════════════════════════════════
//  CLOSE MODAL DISTRIBUTION
// ══════════════════════════════════════
function closeModalEditDistribution() {
  document.getElementById('modalEditDistribution').classList.remove('open');
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModalEditDistribution();
});
// ══════════════════════════════════════
//  UPDATE DISTRIBUTION
// ══════════════════════════════════════
async function updateDistribution() {
  const id          = document.getElementById('edit_id').value;
  const matricule   = document.getElementById('edit_matricule').value.trim();
  const code_f      = document.getElementById('edit_code_f').value.trim();
  const date        = document.getElementById('edit_date').value;
  const qte         = document.getElementById('edit_qte').value.trim();
  const recuperate  = document.getElementById('edit_recuperate').value;
  const recuperePar = document.getElementById('edit_recuperePar').value.trim();
  const designation = document.getElementById('edit_designation').value;

  if (!date || !qte) {
    alert('Veuillez remplir tous les champs.');
    return;
  }

  if (recuperate === 'delegue' && !recuperePar) {
    alert('Veuillez saisir le nom du délégué.');
    return;
  }

  try {
    // ✅ 1. Modifier la distribution
    const res  = await fetch('/api/distribution/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matricule, code_f, date, qte, recuperate, recuperePar })
    });
    const data = await res.json();

    if (!data.success) {
      alert('Erreur : ' + data.message);
      return;
    }

    // ✅ 2. Récupérer les infos personnel pour le PDF
    const pRes  = await fetch('/api/personel/' + matricule);
    const pData = await pRes.json();

    const nom      = pData.success ? pData.data.NOM      : '—';
    const prenom   = pData.success ? pData.data.PRENOM   : '—';
    const service  = pData.success ? pData.data.LIBELLE  : '—';
    const division = pData.success ? pData.data.DIVISION : '—';

    // ✅ 3. Récupérer les infos fourniture pour le PDF
    const fRes  = await fetch('/api/fourniture/' + code_f);
    const fData = await fRes.json();

    const fourniture = fData.success ? fData.data.DESIGNATION : designation;
    const unite      = fData.success ? fData.data.UNITE       : 'U';

    // ✅ 4. Générer le PDF
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
    a.download = `Decharge_${nom}_${prenom}_${matricule}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);

    closeModalEditDistribution();
    loadDistributions();

  } catch (err) {
    alert('Erreur réseau : ' + err);
  }
}

// ══════════════════════════════════════
//  DELETE DISTRIBUTION
// ══════════════════════════════════════
async function deleteDistribution(id) {
  if (!confirm('Supprimer cette distribution ?')) return;

  try {
    const res  = await fetch('/api/distribution/' + id, {
      method: 'DELETE'
    });
    const data = await res.json();

    if (data.success) {
      // reload the table after deletion
      loadDistributions();
    } else {
      alert('Erreur : ' + data.message);
    }
  } catch (err) {
    alert('Erreur réseau : ' + err);
  }
}