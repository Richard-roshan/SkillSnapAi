import React, { useState } from 'react';
import { X, Award, Download, CheckCircle2, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Course } from '../../types';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  userName: string;
  completionDate?: string;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  course,
  userName,
  completionDate
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const dateStr = completionDate 
    ? new Date(completionDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const certId = `SKILLSNAP-CERT-${course.id.toUpperCase()}-9841`;

  const handleDownload = async () => {
    setIsGenerating(true);
    setDownloadSuccess(false);

    try {
      // Create landscape A4 PDF document
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 297;
      const pageHeight = 210;

      // 1. Slate 900 Background Frame (#0F172A)
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // 2. Double Border Accents (Gold & Indigo)
      doc.setDrawColor(245, 158, 11); // Amber gold
      doc.setLineWidth(1.5);
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

      doc.setDrawColor(99, 102, 241); // Indigo accent
      doc.setLineWidth(0.5);
      doc.rect(13, 13, pageWidth - 26, pageHeight - 26);

      // Corner Badges
      doc.setFillColor(245, 158, 11);
      doc.circle(10, 10, 3, 'F');
      doc.circle(pageWidth - 10, 10, 3, 'F');
      doc.circle(10, pageHeight - 10, 3, 'F');
      doc.circle(pageWidth - 10, pageHeight - 10, 3, 'F');

      // 3. Organization Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(245, 158, 11);
      doc.text('SKILLSNAP AI • OFFICIAL VERIFIED CERTIFICATE OF GRADUATION', pageWidth / 2, 32, { align: 'center' });

      // Divider Line
      doc.setDrawColor(51, 65, 85);
      doc.setLineWidth(0.5);
      doc.line(55, 38, pageWidth - 55, 38);

      // 4. Recipient Intro
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(148, 163, 184);
      doc.text('THIS IS TO OFFICIALLY CERTIFY THAT', pageWidth / 2, 54, { align: 'center' });

      // 5. Candidate Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.setTextColor(255, 255, 255);
      doc.text(userName.toUpperCase(), pageWidth / 2, 70, { align: 'center' });

      // 6. Achievement Details
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(148, 163, 184);
      doc.text('has successfully completed all required curriculum modules & practical code evaluations for', pageWidth / 2, 85, { align: 'center' });

      // 7. Course Title & Category
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(129, 140, 248);
      doc.text(course.name, pageWidth / 2, 102, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(165, 180, 252);
      doc.text(`Specialization Category: ${course.category}`, pageWidth / 2, 112, { align: 'center' });

      // 8. Footer Section Line
      doc.setDrawColor(51, 65, 85);
      doc.line(40, 155, pageWidth - 40, 155);

      // Left: Date
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('ISSUE DATE', 45, 166);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(226, 232, 240);
      doc.text(dateStr, 45, 173);

      // Center: Seal
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(52, 211, 153);
      doc.text('✓ SKILLSNAP VERIFIED CREDENTIAL', pageWidth / 2, 169, { align: 'center' });

      // Right: Credential ID
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('CREDENTIAL ID', pageWidth - 45, 166, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(226, 232, 240);
      doc.text(certId, pageWidth - 45, 173, { align: 'right' });

      // Trigger Real PDF Download
      const fileName = `${certId}.pdf`;
      doc.save(fileName);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (e) {
      console.error('Failed to generate certificate PDF:', e);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative animate-in zoom-in-95 space-y-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Certificate Card Frame */}
        <div className="p-8 rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 border-2 border-amber-500/40 text-center relative overflow-hidden shadow-inner space-y-5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-extrabold uppercase tracking-widest">
            <Award className="w-4 h-4 text-amber-400" />
            Official Verified Certificate of Graduation
          </div>

          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest font-mono">This is to certify that</p>
            <h2 className="text-3xl font-black text-white mt-1.5 ai-gradient-text tracking-wide">
              {userName}
            </h2>
          </div>

          <div>
            <p className="text-xs text-slate-400">has successfully completed all required curriculum modules for</p>
            <h3 className="text-xl font-extrabold text-white mt-1">{course.name}</h3>
            <p className="text-xs text-indigo-300 font-semibold mt-1">Category: {course.category}</p>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Issue Date</p>
              <p className="font-bold text-slate-200">{dateStr}</p>
            </div>

            <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>SkillSnap Verified</span>
            </div>

            <div>
              <p className="text-[10px] text-slate-500 uppercase">Credential ID</p>
              <p className="font-bold text-slate-200 text-[10px]">{certId}</p>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {downloadSuccess ? (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              PDF Certificate Saved to Downloads!
            </span>
          ) : (
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Verified Digital Credential
            </span>
          )}

          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating PDF Document...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Certificate PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
