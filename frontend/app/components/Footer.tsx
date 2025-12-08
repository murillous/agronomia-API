import { Github, Linkedin, Instagram, Globe, Code, Cpu } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Lado Esquerdo: Thera Software House */}
          <div className="flex flex-col items-center md:items-start space-y-2">
            <h3 className="text-sm font-bold text-slate-900 tracking-wide uppercase">
              Desenvolvido por Thera Software House
            </h3>
            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/labthera/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-rose-500 transition-colors"
                title="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://www.linkedin.com/company/theralabs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-blue-700 transition-colors"
                title="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
              <a
                href="https://github.com/thera-org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-slate-900 transition-colors"
                title="GitHub"
              >
                <Github size={20} />
              </a>
              <a
                href="https://www.theralabs.com.br/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-emerald-500 transition-colors"
                title="Website Oficial"
              >
                <Globe size={20} />
              </a>
            </div>
          </div>

          {/* Lado Direito: Créditos Pessoais */}
          <div className="flex flex-col items-center md:items-end space-y-1 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <Code size={16} className="text-emerald-500" />
              <span>Full-Stack & API Engineering</span>
            </div>
            <a
              href="https://github.com/murillous"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-800 hover:text-emerald-600 transition-colors flex items-center gap-1 group"
            >
              por Murilo Castelhano
              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400">
                ↗
              </span>
            </a>
            <span className="text-xs text-slate-400">Membro Thera Software House</span>
          </div>
        </div>

        {/* Copyright / Versão */}
        <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400">
          <p>
            &copy; {new Date().getFullYear()} Thera Software House. Todos os
            direitos reservados.
          </p>
          <p className="flex items-center gap-1 mt-2 md:mt-0">
            <Cpu size={12} /> v1.2.0 (Stable)
          </p>
        </div>
      </div>
    </footer>
  );
}
