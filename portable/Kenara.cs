using System;
using System.Diagnostics;
using System.Windows.Forms;
class Kenara {
  [STAThread]
  static void Main() {
    try {
      Process.Start(new ProcessStartInfo("https://brecho-chic-kenara.vercel.app/") { UseShellExecute = true });
    } catch {
      MessageBox.Show("Abra seu navegador e acesse https://brecho-chic-kenara.vercel.app/\nEste acesso precisa de internet.", "Chic Kenara", MessageBoxButtons.OK, MessageBoxIcon.Information);
    }
  }
}
