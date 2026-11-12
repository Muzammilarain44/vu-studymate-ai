export type Concept={title:string;explanation:string;importance:string;sourceQuote:string};
export type Question={question:string;options:[string,string,string,string];correctIndex:number;explanation:string;sourceQuote:string};
export type StudyPack = { title: string; summary: string; takeaways: string[]; concepts: Concept[]; questions: Question[]; mode: 'demo' | 'ai'; createdAt: string; course?: string; _id?: string };
