import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

// Fonction pour ajouter le logo JPG au PDF
export const addLogoImage = async (doc, x, y, width = 40, height = 40) => {
  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        // Timeout après 2 secondes
        drawLogo(doc, x, y, width, height)
        resolve()
      }, 2000)
      
      img.onload = () => {
        clearTimeout(timeout)
        try {
        const canvas = document.createElement('canvas')
        canvas.width = width * 3
        canvas.height = height * 3
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        
        const imgData = canvas.toDataURL('image/jpeg')
        doc.addImage(imgData, 'JPEG', x, y, width, height)
        resolve()
        } catch (error) {
          console.error('Erreur lors de l\'ajout de l\'image:', error)
          drawLogo(doc, x, y, width, height)
          resolve()
        }
      }
      img.onerror = () => {
        clearTimeout(timeout)
        // Fallback : dessiner un logo simple
        drawLogo(doc, x, y, width, height)
        resolve()
      }
      img.src = '/images/télécharger.jpg'
    })
  } catch (error) {
    console.error('Erreur lors du chargement du logo:', error)
    drawLogo(doc, x, y, width, height)
  }
}

// Fonction de fallback pour dessiner le logo
const drawLogo = (doc, x, y, width, height) => {
  doc.setFillColor(99, 102, 241)
  doc.roundedRect(x, y, width, height, 5, 5, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('times', 'bold')
  doc.text('CGSP', x + width / 2, y + height / 2 + 5, { align: 'center' })
}

// Fonction pour formater les montants correctement pour jsPDF
const formatMontant = (montant) => {
  const num = Math.round(Number(montant) || 0)
  // Formater avec des espaces comme séparateurs de milliers
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

// Export d'une facture en PDF
export const exportFacturePDF = async (facture, client, entrepriseInfo = {}) => {
  try {
  const doc = new jsPDF()
  
    // ========== EN-TÊTE ==========
    // Logo à gauche
    try {
  await addLogoImage(doc, 20, 15, 40, 40)
    } catch (logoError) {
      console.error('Erreur logo:', logoError)
      drawLogo(doc, 20, 15, 40, 40)
    }
  
    // Nom de l'entreprise
    doc.setFontSize(16)
    doc.setFont('times', 'bold')
  doc.setTextColor(0, 0, 0)
    doc.text('SOCIETE D\'ENTRETIEN ET DE SECURITE', 70, 25)
  
    // Services de l'entreprise
    doc.setFontSize(9)
    doc.setFont('times', 'normal')
    doc.setTextColor(60, 60, 60)
    const services = 'Sécurité – Gardiennage – Surveillance – Caméra de surveillance Incendie – Entretien bureau – Entretien à domicile – Entretien express'
    const splitServices = doc.splitTextToSize(services, 120)
    let servicesY = 32
    splitServices.forEach((line, index) => {
      doc.text(line, 70, servicesY + (index * 4))
    })
    const servicesEndY = servicesY + (splitServices.length * 4)
  
    // Informations de la facture à droite (positionnées plus bas)
  doc.setFontSize(16)
    doc.setFont('times', 'bold')
  doc.setTextColor(0, 0, 0)
    doc.text('FACTURE', 190, 50, { align: 'right' })
  
  doc.setFontSize(10)
    doc.setFont('times', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(`N°: ${facture.numero || 'N/A'}`, 190, 60, { align: 'right' })
    doc.text(`Date: ${facture.dateEmission ? new Date(facture.dateEmission).toLocaleDateString('fr-FR') : 'N/A'}`, 190, 65, { align: 'right' })
  
  if (facture.dateEcheance) {
      doc.text(`Échéance: ${new Date(facture.dateEcheance).toLocaleDateString('fr-FR')}`, 190, 70, { align: 'right' })
  }
  
    // ========== INFORMATIONS CLIENT ==========
    const clientStartY = Math.max(70, servicesEndY + 20)
  doc.setFontSize(12)
    doc.setFont('times', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Facturé à:', 20, clientStartY)
  
  doc.setFontSize(10)
    doc.setFont('times', 'normal')
    doc.text(client?.nom || 'Client', 20, clientStartY + 8)
  if (client?.adresse) {
      const adresseLines = doc.splitTextToSize(client.adresse, 100)
      adresseLines.forEach((line, index) => {
        doc.text(line, 20, clientStartY + 13 + (index * 5))
      })
  }
  
    // ========== TABLEAU DES ARTICLES ==========
    const tableStartY = clientStartY + (client?.adresse ? 25 : 20)
    
    // Convertir montantHT en nombre pour l'affichage dans le tableau
    const montantHTTable = Number(facture.montantHT) || 0
  
    autoTable(doc, {
    startY: tableStartY,
    head: [['Description', 'Quantité', 'Prix unitaire', 'Total']],
    body: [
      ['Services de sécurité et entretien', '1', 
         `${formatMontant(montantHTTable)} F`, 
         `${formatMontant(montantHTTable)} F`]
    ],
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 9 },
    columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: 20, right: 20 }
  })
  
    // ========== TOTAUX ==========
    const totalsStartY = doc.lastAutoTable.finalY + 15
    
    // Convertir les montants en nombres pour s'assurer qu'ils sont valides
    const montantHT = Number(facture.montantHT) || 0
    const montantTVA = Number(facture.montantTVA) || 0
    const montantTTC = Number(facture.montantTTC) || 0
    const tauxTVA = Number(facture.tauxTVA) || 3
  
  doc.setFontSize(10)
    doc.setFont('times', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(`Montant HT:`, 150, totalsStartY, { align: 'right' })
    doc.text(`${formatMontant(montantHT)} F`, 190, totalsStartY, { align: 'right' })
    
    doc.text(`RSPS (${tauxTVA}%):`, 150, totalsStartY + 6, { align: 'right' })
    doc.text(`${formatMontant(montantTVA)} F`, 190, totalsStartY + 6, { align: 'right' })
  
  doc.setFontSize(12)
    doc.setFont('times', 'bold')
    doc.text(`NET À PAYER:`, 150, totalsStartY + 14, { align: 'right' })
    doc.text(`${formatMontant(montantTTC)} F`, 190, totalsStartY + 14, { align: 'right' })
  
  // Informations de paiement
    let paymentY = totalsStartY + 22
    const montantPaye = Number(facture.montantPaye) || 0
    if (montantPaye > 0) {
      const montantRestant = montantTTC - montantPaye
    doc.setFontSize(10)
      doc.setFont('times', 'normal')
    doc.setTextColor(16, 185, 129)
      doc.text(`Payé:`, 150, paymentY, { align: 'right' })
      doc.text(`${formatMontant(montantPaye)} F`, 190, paymentY, { align: 'right' })
    
    if (montantRestant > 0) {
      doc.setTextColor(239, 68, 68)
        doc.text(`Reste:`, 150, paymentY + 6, { align: 'right' })
        doc.text(`${formatMontant(montantRestant)} F`, 190, paymentY + 6, { align: 'right' })
    } else {
      doc.setTextColor(16, 185, 129)
        doc.text('Payé intégralement', 190, paymentY + 6, { align: 'right' })
    }
      paymentY += 12
  }
  
    // ========== SIGNATURE ==========
    const signatureY = paymentY + 20
    
    // Nom du Directeur aligné à droite
    doc.setFontSize(12)
    doc.setFont('times', 'bold')
    doc.setTextColor(0, 0, 0)
    const nomDirecteur = 'Komla DOLEAGBENOU'
    const nomY = signatureY + 20
    doc.text(nomDirecteur, 190, nomY, { align: 'right' })
    
    // "Le Directeur" centré par rapport au nom, aligné à droite, un peu à gauche
    doc.setFontSize(10)
    doc.setFont('times', 'normal')
    doc.setTextColor(0, 0, 0)
    // Calculer la largeur du nom pour centrer "Le Directeur" par rapport à lui
    const nomWidth = doc.getTextWidth(nomDirecteur)
    const titreWidth = doc.getTextWidth('Le Directeur')
    // Positionner "Le Directeur" pour qu'il soit centré par rapport au nom, mais un peu à gauche
    // Le nom est aligné à droite à X=190, donc son centre est à 190 - nomWidth/2
    // On centre "Le Directeur" sur ce même point, puis on décale un peu à gauche (-10)
    const directeurX = 190 - (nomWidth / 2) - 10
    doc.text('Le Directeur', directeurX, signatureY, { align: 'center' })
    
    // ========== PIED DE PAGE ==========
    const pageHeight = doc.internal.pageSize.height
    const footerStartY = pageHeight - 20
    
    doc.setFontSize(7)
    doc.setFont('times', 'normal')
    doc.setTextColor(60, 60, 60)
    
    const footerText = [
      'Sis à Agoè-démakpoè, Mobile: (+228)22 50 16 93/90 99 68 07/99 64 75 28, Lomé-Togo',
      'N°RCCM: TG-LFW-01-2020-B13-04221; NIF: 1001704793; N°CNSS: 128894',
      'Email: sestogo@sestogo.com. Web: www.sestogo.com',
      'Numéro de compte BOA: TG167 01010 01949640009 71'
    ]
    
    let footerY = footerStartY
    footerText.forEach((line) => {
      const splitLine = doc.splitTextToSize(line, 170)
      splitLine.forEach((textLine) => {
        doc.text(textLine, 105, footerY, { align: 'center' })
        footerY += 3.5
      })
    })
  
  doc.save(`Facture_${facture.numero || 'N/A'}.pdf`)
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error)
    alert('Erreur lors de la génération du PDF: ' + (error.message || 'Erreur inconnue'))
    throw error
  }
}

// Export d'un reçu de caisse en PDF
export const exportRecuCaissePDF = async (operation, client = null, entrepriseInfo = {}) => {
  try {
    const doc = new jsPDF()
    
    // ========== EN-TÊTE ==========
    // Logo à gauche
    try {
      await addLogoImage(doc, 20, 15, 40, 40)
    } catch (logoError) {
      console.error('Erreur logo:', logoError)
      drawLogo(doc, 20, 15, 40, 40)
    }
    
    // Nom de l'entreprise
    doc.setFontSize(16)
    doc.setFont('times', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('COMPAGNIE DE GARDIENNAGE ET DE SÉCURITÉ PRIVÉE', 70, 25)
    
    // Services de l'entreprise
    doc.setFontSize(9)
    doc.setFont('times', 'normal')
    doc.setTextColor(60, 60, 60)
    const services = 'Sécurité – Gardiennage – Surveillance – Caméra de surveillance Incendie – Entretien bureau – Entretien à domicile – Entretien express'
    const splitServices = doc.splitTextToSize(services, 120)
    let servicesY = 32
    splitServices.forEach((line, index) => {
      doc.text(line, 70, servicesY + (index * 4))
    })
    
    // ========== TITRE ==========
    doc.setFontSize(18)
    doc.setFont('times', 'bold')
    doc.setTextColor(0, 0, 0)
    const titleY = Math.max(70, 32 + (splitServices.length * 4) + 15)
    doc.text('REÇU DE PAIEMENT', 105, titleY, { align: 'center' })
    
    // ========== INFORMATIONS DU REÇU ==========
    let infoY = titleY + 15
    
    // Numéro de reçu
    doc.setFontSize(10)
    doc.setFont('times', 'normal')
    doc.text(`N° Reçu: REC-${operation.id}`, 190, infoY, { align: 'right' })
    infoY += 6
    doc.text(`Date: ${operation.date ? new Date(operation.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : new Date().toLocaleDateString('fr-FR')}`, 190, infoY, { align: 'right' })
    
    // ========== INFORMATIONS CLIENT (si disponible) ==========
    if (client) {
      infoY += 15
      doc.setFontSize(12)
      doc.setFont('times', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('Reçu de:', 20, infoY)
      
      doc.setFontSize(10)
      doc.setFont('times', 'normal')
      doc.text(client.nom || 'Client', 20, infoY + 8)
      if (client.adresse) {
        const adresseLines = doc.splitTextToSize(client.adresse, 100)
        adresseLines.forEach((line, index) => {
          doc.text(line, 20, infoY + 13 + (index * 5))
        })
        infoY += 13 + (adresseLines.length * 5)
      } else {
        infoY += 15
      }
    } else {
      infoY += 15
    }
    
    // ========== DÉTAILS DU PAIEMENT ==========
    const detailsStartY = infoY + 10
    
    // Ligne de séparation
    doc.setDrawColor(200, 200, 200)
    doc.line(20, detailsStartY - 5, 190, detailsStartY - 5)
    
    doc.setFontSize(11)
    doc.setFont('times', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Détails du paiement', 20, detailsStartY)
    
    let detailY = detailsStartY + 10
    doc.setFontSize(10)
    doc.setFont('times', 'normal')
    
    // Mode de paiement
    const modeLabel = operation.mode === 'caisse' ? 'Caisse' : 'Banque'
    doc.text('Mode de paiement:', 20, detailY)
    doc.setFont('times', 'bold')
    doc.text(modeLabel, 80, detailY)
    detailY += 8
    
    // Type
    doc.setFont('times', 'normal')
    doc.text('Type:', 20, detailY)
    doc.setFont('times', 'bold')
    doc.text(operation.type === 'entree' ? 'Entrée' : 'Sortie', 80, detailY)
    detailY += 8
    
    // Montant
    doc.setFont('times', 'normal')
    doc.text('Montant:', 20, detailY)
    doc.setFontSize(14)
    doc.setFont('times', 'bold')
    doc.setTextColor(operation.type === 'entree' ? 16 : 239, operation.type === 'entree' ? 185 : 68, operation.type === 'entree' ? 129 : 68)
    doc.text(`${formatMontant(operation.montant)} FCFA`, 80, detailY)
    detailY += 12
    
    // Description
    if (operation.description) {
      doc.setFontSize(10)
      doc.setFont('times', 'normal')
      doc.setTextColor(0, 0, 0)
      doc.text('Description:', 20, detailY)
      const descLines = doc.splitTextToSize(operation.description, 160)
      let descY = detailY + 6
      descLines.forEach((line) => {
        doc.text(line, 25, descY)
        descY += 5
      })
      detailY = descY + 5
    }
    
    // Ligne de séparation
    doc.setDrawColor(200, 200, 200)
    doc.line(20, detailY, 190, detailY)
    
    // ========== SIGNATURE ==========
    const signatureY = detailY + 30
    
    // Nom du Directeur aligné à droite
    doc.setFontSize(12)
    doc.setFont('times', 'bold')
    doc.setTextColor(0, 0, 0)
    const nomDirecteur = 'Komla DOLEAGBENOU'
    const nomY = signatureY + 20
    doc.text(nomDirecteur, 190, nomY, { align: 'right' })
    
    // "Le Directeur" centré par rapport au nom, aligné à droite
    doc.setFontSize(10)
    doc.setFont('times', 'normal')
    doc.setTextColor(0, 0, 0)
    const nomWidth = doc.getTextWidth(nomDirecteur)
    const directeurX = 190 - (nomWidth / 2) - 10
    doc.text('Le Directeur', directeurX, signatureY, { align: 'center' })
    
    // ========== PIED DE PAGE ==========
    const pageHeight = doc.internal.pageSize.height
    const footerStartY = pageHeight - 20
    
    doc.setFontSize(7)
    doc.setFont('times', 'normal')
    doc.setTextColor(60, 60, 60)
    
    const footerText = [
      'Sis à Agoè-démakpoè, Mobile: (+228)22 50 16 93/90 99 68 07/99 64 75 28, Lomé-Togo',
      'N°RCCM: TG-LFW-01-2020-B13-04221; NIF: 1001704793; N°CNSS: 128894',
      'Email: sestogo@sestogo.com. Web: www.sestogo.com',
      'Numéro de compte BOA: TG167 01010 01949640009 71'
    ]
    
    let footerY = footerStartY
    footerText.forEach((line) => {
      const splitLine = doc.splitTextToSize(line, 170)
      splitLine.forEach((textLine) => {
        doc.text(textLine, 105, footerY, { align: 'center' })
        footerY += 3.5
      })
    })
    
    // Nom du fichier
    const dateStr = operation.date ? new Date(operation.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    const filename = `Recu_Paiement_${dateStr}_${operation.id}.pdf`
    doc.save(filename)
  } catch (error) {
    console.error('Erreur lors de la génération du reçu:', error)
    alert('Erreur lors de la génération du reçu PDF')
  }
}

// Export générique vers Excel
export const exportToExcel = (data, filename, headers = []) => {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  
  if (headers.length > 0) {
    XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A1' })
  }
  
  XLSX.utils.book_append_sheet(wb, ws, 'Données')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

// Export générique vers PDF
export const exportToPDF = (data, filename, title = 'Document', headers = []) => {
  const doc = new jsPDF()
  
  doc.setFontSize(16)
  doc.setFont('times', 'bold')
  doc.text(title, 105, 20, { align: 'center' })
  
  if (data && data.length > 0) {
    const tableData = data.map(item => {
      return headers.map(header => item[header.key] || '')
    })
    
    autoTable(doc, {
      startY: 30,
      head: [headers.map(h => h.label)],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] }
    })
  }
  
  doc.save(`${filename}.pdf`)
}

// Export d'une fiche de paie en PDF
export const exportFichePaiePDF = async (fichePaie, employee, entrepriseInfo = {}) => {
  try {
  const doc = new jsPDF()
  
    // ========== EN-TÊTE ==========
    // Logo à gauche
    try {
  await addLogoImage(doc, 20, 15, 40, 40)
    } catch (logoError) {
      console.error('Erreur logo:', logoError)
      drawLogo(doc, 20, 15, 40, 40)
    }
  
    // Nom de l'entreprise
    doc.setFontSize(16)
    doc.setFont('times', 'bold')
  doc.setTextColor(0, 0, 0)
    doc.text('SOCIETE D\'ENTRETIEN ET DE SECURITE', 70, 25)
  
    // Services de l'entreprise
    doc.setFontSize(9)
    doc.setFont('times', 'normal')
    doc.setTextColor(60, 60, 60)
    const services = 'Sécurité – Gardiennage – Surveillance – Caméra de surveillance Incendie – Entretien bureau – Entretien à domicile – Entretien express'
    const splitServices = doc.splitTextToSize(services, 120)
    let servicesY = 32
    splitServices.forEach((line, index) => {
      doc.text(line, 70, servicesY + (index * 4))
    })
    const servicesEndY = servicesY + (splitServices.length * 4)
    
    // Titre FICHE DE PAIE à droite
  doc.setFontSize(16)
    doc.setFont('times', 'bold')
  doc.setTextColor(0, 0, 0)
    doc.text('FICHE DE PAIE', 190, 50, { align: 'right' })
  
  doc.setFontSize(10)
    doc.setFont('times', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text(`Période: ${fichePaie.periode || 'N/A'}`, 190, 60, { align: 'right' })
  
    // ========== INFORMATIONS EMPLOYÉ ==========
    const employeeStartY = Math.max(70, servicesEndY + 20)
  doc.setFontSize(12)
    doc.setFont('times', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Employé:', 20, employeeStartY)
  
  doc.setFontSize(10)
    doc.setFont('times', 'normal')
    doc.text(`${employee?.prenom || ''} ${employee?.nom || ''}`, 20, employeeStartY + 8)
  if (employee?.telephone) {
      doc.text(`Tél: ${employee.telephone}`, 20, employeeStartY + 13)
  }
  if (employee?.email) {
      doc.text(`Email: ${employee.email}`, 20, employeeStartY + 18)
  }
  
    // ========== TABLEAU DES DÉTAILS DE PAIE ==========
    const tableStartY = employeeStartY + (employee?.telephone || employee?.email ? 30 : 25)
    
    // Convertir tous les montants en nombres pour éviter les erreurs
    const salaireBase = Number(fichePaie.salaireBase) || 0
    const heuresTravaillees = Number(fichePaie.heuresTravaillees) || 0
    const joursSupplementaires = Number(fichePaie.heuresSupplementaires) || 0
    const montantHeuresSup = Number(fichePaie.montantHeuresSup) || 0
    const primes = Number(fichePaie.primes) || 0
    const joursConges = Number(fichePaie.joursConges) || 0
    const montantConges = Number(fichePaie.montantConges) || 0
    const joursAbsences = Number(fichePaie.joursAbsences) || 0
    const montantAbsences = Number(fichePaie.montantAbsences) || 0
    const nbRetards = Number(fichePaie.nbRetards) || 0
    const montantRetards = Number(fichePaie.montantRetards) || 0
    const cnss = Number(fichePaie.cnss) || 0
    const autresRetenues = Number(fichePaie.autresRetenues) || 0
    
    autoTable(doc, {
      startY: tableStartY,
    head: [['Libellé', 'Base', 'Taux', 'Gain', 'Retenue']],
    body: [
        ['Salaire de base', '', '', `${formatMontant(salaireBase)} F`, ''],
        ['Jours travaillés', `${heuresTravaillees} j`, '', '', ''],
        ['Jours supplémentaires', `${joursSupplementaires} j`, '', `${formatMontant(montantHeuresSup)} F`, ''],
        ['Primes', '', '', `${formatMontant(primes)} F`, ''],
        ['Congés payés', `${joursConges} j`, '', `${formatMontant(montantConges)} F`, ''],
        ['Absences', `${joursAbsences} j`, '', '', `${formatMontant(montantAbsences)} F`],
        ['Retards', `${nbRetards}`, '', '', `${formatMontant(montantRetards)} F`],
        ['CNSS (9%)', '', '9%', '', `${formatMontant(cnss)} F`],
        ['Autres retenues', '', '', '', `${formatMontant(autresRetenues)} F`]
    ],
    theme: 'striped',
    headStyles: { fillColor: [99, 102, 241] },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 35, halign: 'right' },
      4: { cellWidth: 35, halign: 'right' }
      },
      margin: { left: 20, right: 20 }
  })
  
    // ========== TOTAUX ==========
    const totalsStartY = doc.lastAutoTable.finalY + 15
    
    const totalGains = Number(fichePaie.totalGains) || 0
    const totalRetenues = Number(fichePaie.totalRetenues) || 0
    const netAPayer = Number(fichePaie.netAPayer) || 0
  
  doc.setFontSize(10)
    doc.setFont('times', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(`Total gains:`, 150, totalsStartY, { align: 'right' })
    doc.text(`${formatMontant(totalGains)} F`, 190, totalsStartY, { align: 'right' })
    
    doc.text(`Total retenues:`, 150, totalsStartY + 6, { align: 'right' })
    doc.text(`${formatMontant(totalRetenues)} F`, 190, totalsStartY + 6, { align: 'right' })
  
  doc.setFontSize(12)
    doc.setFont('times', 'bold')
    doc.text(`NET À PAYER:`, 150, totalsStartY + 14, { align: 'right' })
    doc.text(`${formatMontant(netAPayer)} F`, 190, totalsStartY + 14, { align: 'right' })
  
  // Observations
  if (fichePaie.observations) {
      doc.setFontSize(10)
      doc.setFont('times', 'normal')
      doc.setTextColor(0, 0, 0)
      const obsY = totalsStartY + 22
      const obsLines = doc.splitTextToSize(`Observations: ${fichePaie.observations}`, 170)
      obsLines.forEach((line, index) => {
        doc.text(line, 20, obsY + (index * 5))
      })
    }
    
    // ========== SIGNATURE ==========
    // Positionner la signature plus bas
    const baseSignatureY = doc.lastAutoTable.finalY + (fichePaie.observations ? 50 : 35)
    const signatureY = baseSignatureY + 20 // Descendre de 20 unités supplémentaires
    
    // Nom du Directeur aligné à droite
    doc.setFontSize(12)
    doc.setFont('times', 'bold')
    doc.setTextColor(0, 0, 0)
    const nomDirecteur = 'Komla DOLEAGBENOU'
    const nomY = signatureY + 20
    doc.text(nomDirecteur, 190, nomY, { align: 'right' })
    
    // "Le Directeur" centré par rapport au nom, aligné à droite, un peu à gauche
    doc.setFontSize(10)
    doc.setFont('times', 'normal')
    doc.setTextColor(0, 0, 0)
    const nomWidth = doc.getTextWidth(nomDirecteur)
    const titreWidth = doc.getTextWidth('Le Directeur')
    const directeurX = 190 - (nomWidth / 2) - 10
    doc.text('Le Directeur', directeurX, signatureY, { align: 'center' })
    
    // ========== PIED DE PAGE ==========
    const pageHeight = doc.internal.pageSize.height
    const footerStartY = pageHeight - 20
    
    doc.setFontSize(7)
    doc.setFont('times', 'normal')
    doc.setTextColor(60, 60, 60)
    
    const footerText = [
      'Sis à Agoè-démakpoè, Mobile: (+228)22 50 16 93/90 99 68 07/99 64 75 28, Lomé-Togo',
      'N°RCCM: TG-LFW-01-2020-B13-04221; NIF: 1001704793; N°CNSS: 128894',
      'Email: sestogo@sestogo.com. Web: www.sestogo.com',
      'Numéro de compte BOA: TG167 01010 01949640009 71'
    ]
    
    let footerY = footerStartY
    footerText.forEach((line) => {
      const splitLine = doc.splitTextToSize(line, 170)
      splitLine.forEach((textLine) => {
        doc.text(textLine, 105, footerY, { align: 'center' })
        footerY += 3.5
      })
    })
  
  const periode = fichePaie.periode || 'N/A'
  const nom = employee ? `${employee.prenom}_${employee.nom}` : 'Employe'
  doc.save(`Fiche_Paie_${nom}_${periode.replace(/\//g, '_')}.pdf`)
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error)
    alert('Erreur lors de la génération du PDF: ' + (error.message || 'Erreur inconnue'))
    throw error
  }
}

// Export du Grand Livre en PDF
export const exportGrandLivrePDF = async (grandLivre, dateDebut = '', dateFin = '') => {
  try {
    const doc = new jsPDF()
    
    // ========== EN-TÊTE ==========
    try {
      await addLogoImage(doc, 20, 15, 40, 40)
    } catch (logoError) {
      console.error('Erreur logo:', logoError)
      drawLogo(doc, 20, 15, 40, 40)
    }
    
    // Nom de l'entreprise
    doc.setFontSize(16)
    doc.setFont('times', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('COMPAGNIE DE GARDIENNAGE ET DE SÉCURITÉ PRIVÉE', 70, 25)
    
    // Titre
    doc.setFontSize(18)
    doc.setFont('times', 'bold')
    doc.text('GRAND LIVRE', 105, 45, { align: 'center' })
    
    // Période
    if (dateDebut && dateFin) {
      doc.setFontSize(10)
      doc.setFont('times', 'normal')
      doc.setTextColor(0, 0, 0)
      const debutStr = new Date(dateDebut).toLocaleDateString('fr-FR')
      const finStr = new Date(dateFin).toLocaleDateString('fr-FR')
      doc.text(`Période: ${debutStr} au ${finStr}`, 105, 52, { align: 'center' })
    }
    
    // Date de génération
    doc.setFontSize(9)
    doc.setFont('times', 'normal')
    doc.setTextColor(60, 60, 60)
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 190, 52, { align: 'right' })
    
    // ========== TABLEAU ==========
    const tableData = grandLivre.map(compte => {
      const solde = compte.credit - compte.debit
      return [
        compte.compte || '',
        compte.libelle || '',
        compte.debit > 0 ? formatMontant(compte.debit) + ' F' : '-',
        compte.credit > 0 ? formatMontant(compte.credit) + ' F' : '-',
        solde !== 0 ? (solde >= 0 ? '+' : '') + formatMontant(Math.abs(solde)) + ' F' : '-'
      ]
    })
    
    // Totaux
    const totalDebit = grandLivre.reduce((sum, c) => sum + (c.debit || 0), 0)
    const totalCredit = grandLivre.reduce((sum, c) => sum + (c.credit || 0), 0)
    const totalSolde = totalCredit - totalDebit
    
    if (tableData.length > 0) {
      tableData.push([
        'TOTAL',
        '',
        formatMontant(totalDebit) + ' F',
        formatMontant(totalCredit) + ' F',
        (totalSolde >= 0 ? '+' : '') + formatMontant(Math.abs(totalSolde)) + ' F'
      ])
    }
    
    autoTable(doc, {
      startY: 60,
      head: [['Compte', 'Libellé', 'Débit', 'Crédit', 'Solde']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 30, halign: 'left' },
        1: { cellWidth: 70, halign: 'left' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: 20, right: 20 },
      didParseCell: function(data) {
        if (data.row.index === tableData.length - 1 && data.column.index === 0) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = [240, 240, 240]
        }
      }
    })
    
    // ========== PIED DE PAGE ==========
    const pageHeight = doc.internal.pageSize.height
    const footerStartY = pageHeight - 20
    
    doc.setFontSize(7)
    doc.setFont('times', 'normal')
    doc.setTextColor(60, 60, 60)
    
    const footerText = [
      'Sis à Agoè-démakpoè, Mobile: (+228)22 50 16 93/90 99 68 07/99 64 75 28, Lomé-Togo',
      'N°RCCM: TG-LFW-01-2020-B13-04221; NIF: 1001704793; N°CNSS: 128894',
      'Email: sestogo@sestogo.com. Web: www.sestogo.com',
      'Numéro de compte BOA: TG167 01010 01949640009 71'
    ]
    
    let footerY = footerStartY
    footerText.forEach((line) => {
      const splitLine = doc.splitTextToSize(line, 170)
      splitLine.forEach((textLine) => {
        doc.text(textLine, 105, footerY, { align: 'center' })
        footerY += 3.5
      })
    })
    
    const dateStr = dateDebut && dateFin 
      ? `${new Date(dateDebut).toISOString().split('T')[0]}_${new Date(dateFin).toISOString().split('T')[0]}`
      : new Date().toISOString().split('T')[0]
    doc.save(`Grand_Livre_${dateStr}.pdf`)
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error)
    alert('Erreur lors de la génération du PDF du Grand Livre')
    throw error
  }
}

// Export de la Balance en PDF
export const exportBalancePDF = async (balance, dateDebut = '', dateFin = '') => {
  try {
    const doc = new jsPDF()
    
    // ========== EN-TÊTE ==========
    try {
      await addLogoImage(doc, 20, 15, 40, 40)
    } catch (logoError) {
      console.error('Erreur logo:', logoError)
      drawLogo(doc, 20, 15, 40, 40)
    }
    
    // Nom de l'entreprise
    doc.setFontSize(16)
    doc.setFont('times', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('COMPAGNIE DE GARDIENNAGE ET DE SÉCURITÉ PRIVÉE', 70, 25)
    
    // Titre
    doc.setFontSize(18)
    doc.setFont('times', 'bold')
    doc.text('BALANCE COMPTABLE', 105, 45, { align: 'center' })
    
    // Période
    if (dateDebut && dateFin) {
      doc.setFontSize(10)
      doc.setFont('times', 'normal')
      doc.setTextColor(0, 0, 0)
      const debutStr = new Date(dateDebut).toLocaleDateString('fr-FR')
      const finStr = new Date(dateFin).toLocaleDateString('fr-FR')
      doc.text(`Période: ${debutStr} au ${finStr}`, 105, 52, { align: 'center' })
    }
    
    // Date de génération
    doc.setFontSize(9)
    doc.setFont('times', 'normal')
    doc.setTextColor(60, 60, 60)
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 190, 52, { align: 'right' })
    
    // ========== TABLEAU ==========
    const tableData = balance.details.map(detail => {
      return [
        detail.compte || '',
        detail.libelle || '',
        detail.debit > 0 ? formatMontant(detail.debit) + ' F' : '-',
        detail.credit > 0 ? formatMontant(detail.credit) + ' F' : '-',
        detail.solde !== 0 ? (detail.solde >= 0 ? '+' : '') + formatMontant(Math.abs(detail.solde)) + ' F' : '-'
      ]
    })
    
    // Totaux
    if (tableData.length > 0) {
      tableData.push([
        'TOTAL',
        '',
        formatMontant(balance.totalDebit) + ' F',
        formatMontant(balance.totalCredit) + ' F',
        (balance.solde >= 0 ? '+' : '') + formatMontant(Math.abs(balance.solde)) + ' F'
      ])
    }
    
    autoTable(doc, {
      startY: 60,
      head: [['Compte', 'Libellé', 'Débit', 'Crédit', 'Solde']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 30, halign: 'left' },
        1: { cellWidth: 70, halign: 'left' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: 20, right: 20 },
      didParseCell: function(data) {
        if (data.row.index === tableData.length - 1 && data.column.index === 0) {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = [240, 240, 240]
        }
      }
    })
    
    // ========== PIED DE PAGE ==========
    const pageHeight = doc.internal.pageSize.height
    const footerStartY = pageHeight - 20
    
    doc.setFontSize(7)
    doc.setFont('times', 'normal')
    doc.setTextColor(60, 60, 60)
    
    const footerText = [
      'Sis à Agoè-démakpoè, Mobile: (+228)22 50 16 93/90 99 68 07/99 64 75 28, Lomé-Togo',
      'N°RCCM: TG-LFW-01-2020-B13-04221; NIF: 1001704793; N°CNSS: 128894',
      'Email: sestogo@sestogo.com. Web: www.sestogo.com',
      'Numéro de compte BOA: TG167 01010 01949640009 71'
    ]
    
    let footerY = footerStartY
    footerText.forEach((line) => {
      const splitLine = doc.splitTextToSize(line, 170)
      splitLine.forEach((textLine) => {
        doc.text(textLine, 105, footerY, { align: 'center' })
        footerY += 3.5
      })
    })
    
    const dateStr = dateDebut && dateFin 
      ? `${new Date(dateDebut).toISOString().split('T')[0]}_${new Date(dateFin).toISOString().split('T')[0]}`
      : new Date().toISOString().split('T')[0]
    doc.save(`Balance_${dateStr}.pdf`)
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error)
    alert('Erreur lors de la génération du PDF de la Balance')
    throw error
  }
}

// Export du Journal en PDF
export const exportJournalPDF = async (ecritures, dateDebut = '', dateFin = '') => {
  try {
    const doc = new jsPDF('landscape') // Orientation paysage pour plus d'espace
    
    // ========== EN-TÊTE ==========
    try {
      await addLogoImage(doc, 15, 10, 35, 35)
    } catch (logoError) {
      console.error('Erreur logo:', logoError)
      drawLogo(doc, 15, 10, 35, 35)
    }
    
    // Nom de l'entreprise
    doc.setFontSize(14)
    doc.setFont('times', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('COMPAGNIE DE GARDIENNAGE ET DE SÉCURITÉ PRIVÉE', 60, 20)
    
    // Titre
    doc.setFontSize(16)
    doc.setFont('times', 'bold')
    doc.text('JOURNAL COMPTABLE', 150, 35, { align: 'center' })
    
    // Période
    if (dateDebut && dateFin) {
      doc.setFontSize(9)
      doc.setFont('times', 'normal')
      doc.setTextColor(0, 0, 0)
      const debutStr = new Date(dateDebut).toLocaleDateString('fr-FR')
      const finStr = new Date(dateFin).toLocaleDateString('fr-FR')
      doc.text(`Période: ${debutStr} au ${finStr}`, 150, 41, { align: 'center' })
    }
    
    // Date de génération
    doc.setFontSize(8)
    doc.setFont('times', 'normal')
    doc.setTextColor(60, 60, 60)
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 285, 41, { align: 'right' })
    
    // ========== PRÉPARATION DES DONNÉES ==========
    const tableData = []
    
    ecritures.forEach(ecriture => {
      if (!ecriture) return
      
      const date = ecriture.date ? new Date(ecriture.date).toLocaleDateString('fr-FR') : '-'
      const jour = ecriture.jour || (ecriture.date ? new Date(ecriture.date).getDate().toString().padStart(2, '0') : '-')
      const numero = ecriture.numero || '-'
      const numeroFacture = ecriture.numeroFacture || '-'
      const reference = ecriture.reference || '-'
      const libelle = ecriture.libelle || '-'
      
      // Traiter les lignes de débit
      if (ecriture.lignesDebit && Array.isArray(ecriture.lignesDebit)) {
        ecriture.lignesDebit.forEach((ligne, index) => {
          if (ligne.compte && ligne.montant) {
            const compteComplet = ligne.compteTiers ? `${ligne.compte}-${ligne.compteTiers}` : ligne.compte
            tableData.push([
              index === 0 ? jour : '',
              index === 0 ? numero : '',
              index === 0 ? numeroFacture : '',
              index === 0 ? reference : '',
              compteComplet,
              index === 0 ? libelle : (ligne.libelle || ''),
              formatMontant(ligne.montant) + ' F',
              '',
              ecriture.journal || '-'
            ])
          }
        })
      } else {
        // Fallback pour l'ancien format
        const compteDebit = ecriture.compteDebit || '-'
        const montantDebit = parseFloat(ecriture.montantDebit) || parseFloat(ecriture.montant) || 0
        if (compteDebit !== '-' && montantDebit > 0) {
          tableData.push([
            jour,
            numero,
            numeroFacture,
            reference,
            compteDebit,
            libelle,
            formatMontant(montantDebit) + ' F',
            '',
            ecriture.journal || '-'
          ])
        }
      }
      
      // Traiter les lignes de crédit
      if (ecriture.lignesCredit && Array.isArray(ecriture.lignesCredit)) {
        ecriture.lignesCredit.forEach((ligne, index) => {
          if (ligne.compte && ligne.montant) {
            const compteComplet = ligne.compteTiers ? `${ligne.compte}-${ligne.compteTiers}` : ligne.compte
            tableData.push([
              '',
              '',
              '',
              '',
              compteComplet,
              ligne.libelle || libelle,
              '',
              formatMontant(ligne.montant) + ' F',
              ''
            ])
          }
        })
      } else {
        // Fallback pour l'ancien format
        const compteCredit = ecriture.compteCredit || '-'
        const montantCredit = parseFloat(ecriture.montantCredit) || parseFloat(ecriture.montant) || 0
        if (compteCredit !== '-' && montantCredit > 0) {
          tableData.push([
            '',
            '',
            '',
            '',
            compteCredit,
            libelle,
            '',
            formatMontant(montantCredit) + ' F',
            ''
          ])
        }
      }
    })
    
    // Totaux
    const totalDebit = ecritures.reduce((sum, e) => sum + (parseFloat(e?.montantDebit) || parseFloat(e?.montant) || 0), 0)
    const totalCredit = ecritures.reduce((sum, e) => sum + (parseFloat(e?.montantCredit) || parseFloat(e?.montant) || 0), 0)
    
    if (tableData.length > 0) {
      tableData.push([
        '',
        '',
        '',
        'TOTAUX JOURNAL',
        '',
        '',
        formatMontant(totalDebit) + ' F',
        formatMontant(totalCredit) + ' F',
        ''
      ])
    }
    
    // ========== TABLEAU ==========
    autoTable(doc, {
      startY: 50,
      head: [['Jour', 'N° pièce', 'N° facture', 'Référence', 'N° compte', 'Libellé', 'Débit', 'Crédit', 'Journal']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241], fontStyle: 'bold', fontSize: 8 },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 25, halign: 'left' },
        4: { cellWidth: 30, halign: 'left' },
        5: { cellWidth: 50, halign: 'left' },
        6: { cellWidth: 30, halign: 'right' },
        7: { cellWidth: 30, halign: 'right' },
        8: { cellWidth: 25, halign: 'center' }
      },
      margin: { left: 10, right: 10 },
      didParseCell: function(data) {
        if (tableData[data.row.index] && tableData[data.row.index][3] === 'TOTAUX JOURNAL') {
          data.cell.styles.fontStyle = 'bold'
          data.cell.styles.fillColor = [240, 240, 240]
        }
      }
    })
    
    // ========== PIED DE PAGE ==========
    const pageHeight = doc.internal.pageSize.height
    const footerStartY = pageHeight - 15
    
    doc.setFontSize(6)
    doc.setFont('times', 'normal')
    doc.setTextColor(60, 60, 60)
    
    const footerText = [
      'Sis à Agoè-démakpoè, Mobile: (+228)22 50 16 93/90 99 68 07/99 64 75 28, Lomé-Togo',
      'N°RCCM: TG-LFW-01-2020-B13-04221; NIF: 1001704793; N°CNSS: 128894',
      'Email: sestogo@sestogo.com. Web: www.sestogo.com',
      'Numéro de compte BOA: TG167 01010 01949640009 71'
    ]
    
    let footerY = footerStartY
    footerText.forEach((line) => {
      const splitLine = doc.splitTextToSize(line, 270)
      splitLine.forEach((textLine) => {
        doc.text(textLine, 150, footerY, { align: 'center' })
        footerY += 3
      })
    })
    
    const dateStr = dateDebut && dateFin 
      ? `${new Date(dateDebut).toISOString().split('T')[0]}_${new Date(dateFin).toISOString().split('T')[0]}`
      : new Date().toISOString().split('T')[0]
    doc.save(`Journal_${dateStr}.pdf`)
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error)
    alert('Erreur lors de la génération du PDF du Journal')
    throw error
  }
}
