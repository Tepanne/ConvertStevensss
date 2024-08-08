// Daftar whitelist pengguna
const whitelist = {
  'topa12dewa': 'User1',
  'JONI HARMONI': 'User2',
  'dendengsapi': 'User3',
  'lanciao': 'User4',
  'tuyuljelek': 'User5'
};

function isWhitelisted(keyword) {
  return whitelist.hasOwnProperty(keyword);
}

document.getElementById('whitelistButton').addEventListener('click', function() {
  const keyword = document.getElementById('whitelistInput').value.trim();
  if (isWhitelisted(keyword)) {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
  } else {
    alert('Kata kunci tidak valid!');
  }
});

// Fungsi untuk menghitung jumlah kontak dalam textarea
function countContacts(text) {
  // Memisahkan kontak berdasarkan baris
  const contacts = text.split('\n').filter(line => line.trim() !== '');
  return contacts.length;
}

// Fungsi untuk menampilkan jumlah kontak di label
function updateContactCount() {
  const text = document.getElementById('fileContent').value.trim();
  const contactCount = countContacts(text);
  document.getElementById('contactCountLabel').textContent = `Jumlah Kontak: ${contactCount}`;
}

// Fungsi untuk membaca dan menampilkan isi file teks ke textarea (dengan update count)
document.getElementById('txtFileInput').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const content = e.target.result;
      document.getElementById('fileContent').value = content;
      updateContactCount(); // Update count setelah file dibaca
    };
    reader.readAsText(file);
  }
});

// Update contact count setiap kali textarea diubah
document.getElementById('fileContent').addEventListener('input', updateContactCount);

// Fungsi untuk memformat nomor telepon
function formatPhoneNumber(number) {
  return number.startsWith('+') ? number : `+${number}`;
}

// Fungsi untuk mengkonversi file teks ke VCF dengan validasi kategori
document.getElementById('convertButton').addEventListener('click', function() {
  const text = document.getElementById('fileContent').value.trim();
  const fileName = document.getElementById('convertFileNameInput').value.trim() || 'output';
  const contactNamePrefix = document.getElementById('contactNameInput').value.trim() || 'Contact';
  const adminName = document.getElementById('adminNameInput').value.trim() || 'Admin';
  const navyName = document.getElementById('navyNameInput').value.trim() || 'Navy';
  const anggotaName = document.getElementById('anggotaNameInput').value.trim() || 'Anggota';

  if (!text) {
    alert('Isi textarea tidak boleh kosong!');
    return;
  }

  // Parsing the input text based on categories
  const categories = { admin: [], navy: [], anggota: [] };
  let currentCategory = '';

  text.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine) {
      if (['admin', 'navy', 'anggota'].includes(trimmedLine.toLowerCase())) {
        currentCategory = trimmedLine.toLowerCase();
      } else if (currentCategory) {
        categories[currentCategory].push(trimmedLine);
      }
    }
  });

  // Generate VCF content for each category
  let vcfContent = '';
  let totalContacts = 0; // Initialize totalContacts

  Object.keys(categories).forEach(category => {
    const contacts = categories[category];
    const categoryName = category === 'admin' ? adminName : 
                         category === 'navy' ? navyName : 
                         anggotaName;

    contacts.forEach((contact, index) => {
      const formattedContact = formatPhoneNumber(contact);
      vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:${contactNamePrefix}-${categoryName}-${index + 1}\nTEL:${formattedContact}\nEND:VCARD\n`;
      totalContacts++; // Count each contact
    });
  });

  const blob = new Blob([vcfContent], { type: 'text/vcard' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${fileName}.vcf`;
  link.classList.add('download-link');
  link.textContent = `${fileName}.vcf`;
  document.getElementById('convertedTxtToVcfFiles').appendChild(link);

  // Display the total number of contacts
  document.getElementById('totalContactsLabel').textContent = `Total Kontak: ${totalContacts}`;

  // Log activity
  logActivity('Mengkonversi file teks ke VCF dengan kategori');
});

// Fungsi untuk membaca dan menampilkan isi file VCF ke textarea
document.getElementById('vcfToTxtFileInput').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const content = e.target.result;
      const phoneNumbers = content.match(/TEL:(.+)/g)
        .map(line => line.replace('TEL:', '').trim())
        .map(number => formatPhoneNumber(number))
        .join('\n');
      document.getElementById('txtFileContent').value = phoneNumbers;
    };
    reader.readAsText(file);
  }
});

// Fungsi untuk memecah file VCF
document.getElementById('splitButton').addEventListener('click', function() {
  const file = document.getElementById('vcfFileInput').files[0];
  const contactsPerFile = parseInt(document.getElementById('contactsPerFile').value, 10);
  const fileName = document.getElementById('splitFileNameInput').value.trim() || 'split';

  if (!file || isNaN(contactsPerFile) || contactsPerFile <= 0) {
    alert('Masukkan file VCF dan jumlah kontak per file yang valid!');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const content = e.target.result;
    const contacts = content.split('END:VCARD').map(contact => contact.trim() + '\nEND:VCARD').filter(contact => contact.length > 10);

    if (contacts.length === 0) {
      alert('File VCF tidak berisi kontak yang valid!');
      return;
    }

    const splitFiles = [];
    for (let i = 0; i < contacts.length; i += contactsPerFile) {
      const vcfContent = contacts.slice(i, i + contactsPerFile).join('\n');
      const blob = new Blob([vcfContent], { type: 'text/vcard' });
      splitFiles.push(blob);
    }

    splitFiles.forEach((blob, index) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${fileName}-${index + 1}.vcf`;
      link.classList.add('download-link');
      link.textContent = `${fileName}-${index + 1}.vcf`;
      document.getElementById('splitVcfFiles').appendChild(link);
    });

    // Log activity
    logActivity('Memecah file VCF');
  };
  reader.readAsText(file);
});

// Fungsi untuk menggabungkan file teks dengan menghapus duplikasi
document.getElementById('mergeButton').addEventListener('click', function() {
  const files = document.getElementById('txtFilesInput').files;
  const fileName = document.getElementById('mergedFileNameInput').value.trim() || 'merged';

  if (files.length === 0) {
    alert('Masukkan file TXT untuk digabungkan!');
    return;
  }

  const reader = new FileReader();
  let uniqueLines = new Set(); // Untuk menyimpan kontak yang unik

  const readFile = (index) => {
    if (index >= files.length) {
      // Membuat isi file gabungan
      const mergedContent = Array.from(uniqueLines).join('\n');
      const blob = new Blob([mergedContent], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${fileName}.txt`;
      link.classList.add('download-link');
      link.textContent = `${fileName}.txt`;
      document.getElementById('mergedTxtFiles').appendChild(link);

      // Log aktivitas
      logActivity('Menggabungkan file TXT dan menghapus duplikasi kontak atau huruf');
      return;
    }

    reader.onload = function(e) {
      const lines = e.target.result.split('\n').map(line => line.trim()).filter(line => line.length > 0);

      lines.forEach(line => {
        uniqueLines.add(line); // Menambahkan setiap kontak yang unik ke dalam Set
      });

      readFile(index + 1);
    };

    reader.readAsText(files[index]);
  };

  readFile(0);
});

// Fungsi untuk mencatat aktivitas
function logActivity(activity) {
  const reportContent = document.getElementById('reportContent');
  reportContent.value += `[${new Date().toLocaleString()}] ${activity}\n`;
  reportContent.scrollTop = reportContent.scrollHeight;
}

// Memanggil updateContactCount saat halaman pertama kali dimuat (opsional)
document.addEventListener('DOMContentLoaded', updateContactCount);
