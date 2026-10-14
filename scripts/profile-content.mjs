// Source of truth for the Stints, Power Unit and Podium cards. Facts come from the Lattes CV and the
// public GitHub repositories. Edit here, then run `node scripts/generate-sections.mjs`.
const REPO = 'https://github.com/fraissatt/';
const ITEMS = {
  engine: ['Java', 'Spring Boot', 'C#', 'REST APIs'],
  chassis: ['TypeScript', 'Angular', 'Dart'],
  fuel: ['PostgreSQL', 'SQL'],
  aero: ['AWS'],
  telemetry: ['Git/GitHub', 'Swagger'],
};

export const CONTENT = {
  pt: {
    stintsTitle: 'RACE STRATEGY · Stints · Experiência',
    powerTitle: 'POWER UNIT · Stack',
    stints: [
      { n: 4, org: 'ZEISS IQS, Oberkochen, Alemanha', period: '2025 – 2026',
        text: 'Estágio internacional: desenvolvimento e manutenção de aplicações web com C#, Angular, SQL, REST APIs, Swagger e Git/GitHub.' },
      { n: 3, org: 'Centro de Metrologia SENAI ZEISS', period: '01/2025 – 09/2025',
        text: 'ZEISS PILOT, sistema web de gestão do laboratório (Spring Boot, PostgreSQL, dashboards e relatórios); operação de equipamentos de metrologia.' },
      { n: 2, org: 'Instituto SENAI de Tecnologia em Automação', period: '06/2024 – 01/2025',
        text: 'Desenvolvimento full stack de sistema web para relatórios de Emissão Acústica: hierarquia de usuários, dashboards dinâmicos e engenharia de requisitos.' },
      { n: 1, org: 'Integra Engenharia de Sistemas', period: '01/2024 – 04/2024',
        text: 'Estágio em suporte: instalação e configuração de sistemas operacionais.' },
    ],
    categories: [
      { name: 'ENGINE', label: 'Back-end', items: ITEMS.engine },
      { name: 'CHASSIS', label: 'Front-end', items: ITEMS.chassis },
      { name: 'FUEL', label: 'Dados', items: ITEMS.fuel },
      { name: 'AERO', label: 'Cloud', items: ITEMS.aero },
      { name: 'TELEMETRY', label: 'Ferramentas', items: ITEMS.telemetry },
    ],
    podium: [
      { place: 1, name: 'metas-app', lang: 'TypeScript', url: `${REPO}metas-app`,
        text: 'Aplicação web em TypeScript, publicada na Vercel.' },
      { place: 2, name: 'CEM-Senai-Zeiss', lang: 'JavaScript', url: `${REPO}CEM-Senai-Zeiss`,
        text: 'Projeto em JavaScript ligado ao Centro de Metrologia SENAI ZEISS.' },
      { place: 3, name: 'boas-praticas-software', lang: 'Java', url: `${REPO}boas-praticas-software`,
        text: 'Projeto em Java sobre boas práticas de desenvolvimento de software.' },
    ],
  },
  en: {
    stintsTitle: 'RACE STRATEGY · Stints · Experience',
    powerTitle: 'POWER UNIT · Stack',
    stints: [
      { n: 4, org: 'ZEISS IQS, Oberkochen, Germany', period: '2025 – 2026',
        text: 'International internship: development and maintenance of web applications with C#, Angular, SQL, REST APIs, Swagger and Git/GitHub.' },
      { n: 3, org: 'SENAI ZEISS Metrology Center', period: '01/2025 – 09/2025',
        text: 'ZEISS PILOT, a web system to manage the laboratory (Spring Boot, PostgreSQL, dashboards and reports); hands-on operation of metrology equipment.' },
      { n: 2, org: 'SENAI Institute of Automation Technology', period: '06/2024 – 01/2025',
        text: 'Full stack development of a web system for Acoustic Emission reports: user hierarchy, dynamic dashboards and requirements engineering.' },
      { n: 1, org: 'Integra Engenharia de Sistemas', period: '01/2024 – 04/2024',
        text: 'Support internship: installation and configuration of operating systems.' },
    ],
    categories: [
      { name: 'ENGINE', label: 'Back-end', items: ITEMS.engine },
      { name: 'CHASSIS', label: 'Front-end', items: ITEMS.chassis },
      { name: 'FUEL', label: 'Data', items: ITEMS.fuel },
      { name: 'AERO', label: 'Cloud', items: ITEMS.aero },
      { name: 'TELEMETRY', label: 'Tooling', items: ITEMS.telemetry },
    ],
    podium: [
      { place: 1, name: 'metas-app', lang: 'TypeScript', url: `${REPO}metas-app`,
        text: 'TypeScript web application, deployed on Vercel.' },
      { place: 2, name: 'CEM-Senai-Zeiss', lang: 'JavaScript', url: `${REPO}CEM-Senai-Zeiss`,
        text: 'JavaScript project tied to the SENAI ZEISS Metrology Center.' },
      { place: 3, name: 'boas-praticas-software', lang: 'Java', url: `${REPO}boas-praticas-software`,
        text: 'Java project on software development best practices.' },
    ],
  },
};
