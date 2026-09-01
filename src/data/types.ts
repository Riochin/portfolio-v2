export type Work = {
  title: string;
  period: string;
  description: string;
  role: string;
  stack: string[];
  links: {
    repo?: string;
    demo?: string;
    article?: string;
  };
  image?: string;
  relatedExperience?: string;
};

export type Experience = {
  organization: string;
  position: string;
  period: string;
  description: string;
  stack?: string[];
};
