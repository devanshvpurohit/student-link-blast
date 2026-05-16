export interface Quote {
    text: string;
    category: 'motivational' | 'thought-provoking' | 'punchy';
}

export const QUOTES: Quote[] = [
    // Short & Motivational
    { text: "Anything’s possible, you gotta dream like you never seen obstacles.", category: 'motivational' },
    { text: "Keep grindin’ boy, your life can change in one year, and even when it’s dark out, the sun is shining somewhere.", category: 'motivational' },
    { text: "Never give up until you’ve given out all your very best.", category: 'motivational' },
    { text: "Follow your heart, don’t follow what you’ve been told you’re supposed to do.", category: 'motivational' },
    { text: "You are perfect exactly as you are.", category: 'motivational' },
    { text: "To appreciate the sun, you gotta know what rain is.", category: 'motivational' },
    { text: "Life is a movie, pick your own role, climb your own ladder.", category: 'motivational' },
    { text: "Take a chance, because you never know how perfect something can turn out.", category: 'motivational' },
    { text: "It’s beauty in the struggle, ugliness in the success.", category: 'motivational' },
    { text: "If they don’t know your dreams, then they can’t shoot them down.", category: 'motivational' },

    // Thought-Provoking
    { text: "You have to hurt in order to know. Fall in order to grow.", category: 'thought-provoking' },
    { text: "Nothing lasts forever, but at least we’ve got these memories.", category: 'thought-provoking' },
    { text: "Sometimes our dreams come true, sometimes our fears do too.", category: 'thought-provoking' },
    { text: "We ain’t picture perfect, but we worth the picture still.", category: 'thought-provoking' },
    { text: "It’s beauty in the struggle.", category: 'thought-provoking' },

    // Short Punchy Lines
    { text: "Dream like you’ve never seen obstacles.", category: 'punchy' },
    { text: "Life is all about the evolution.", category: 'punchy' },
    { text: "Don’t let your dreams be dreams.", category: 'punchy' },
    { text: "Keep your circle small and your mind open.", category: 'punchy' }
];

export const getRandomQuote = (category?: Quote['category']): string => {
    const filtered = category ? QUOTES.filter(q => q.category === category) : QUOTES;
    const randomIndex = Math.floor(Math.random() * filtered.length);
    return filtered[randomIndex].text;
};
