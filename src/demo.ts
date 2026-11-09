import type { StudyPack } from './types';
export const sampleLecture = `Course: CS101 - Introduction to Computing
Lecture: Computer Networks
A computer network connects two or more devices to exchange data and share resources. A Local Area Network (LAN) connects devices in a limited area such as a home, office, or university lab. A Wide Area Network (WAN) connects networks across larger geographical areas; the Internet is a global network of networks.
An IP address identifies a device on a network. DNS translates human-readable domain names into IP addresses. HTTP and HTTPS are protocols used by browsers to request web resources; HTTPS uses encryption to protect data in transit.
A router forwards packets between different networks. A switch connects devices inside a local network. Packet switching breaks data into smaller packets which can travel independently and be reassembled at the destination.
Network security includes strong passwords, firewalls, software updates and encrypted communication. A firewall filters incoming and outgoing network traffic according to rules.`;
export const demoPack: StudyPack = {
  title:'Computer Networks — CS101',
  summary:'Computer networks connect devices so they can exchange data and share resources. LANs cover a small physical area, while WANs span larger distances. DNS resolves domain names, IP addresses identify devices, routers connect networks and switches connect devices within a LAN. HTTPS protects web traffic using encryption.',
  takeaways:['LAN = local area; WAN = large geographical area','DNS converts domain names to IP addresses','Router connects networks; switch connects LAN devices','HTTPS protects information in transit'],
  concepts:[
    {title:'LAN vs WAN',explanation:'A LAN serves a building or lab; a WAN connects networks over cities or countries.',importance:'Core networking distinction',sourceQuote:'A Local Area Network (LAN) connects devices in a limited area'},
    {title:'DNS',explanation:'DNS is like a contacts list for the internet: it looks up the IP address for a domain.',importance:'Explains how websites are found',sourceQuote:'DNS translates human-readable domain names into IP addresses'},
    {title:'Router vs Switch',explanation:'A switch connects devices inside one LAN; a router passes packets across different networks.',importance:'Frequently confused components',sourceQuote:'A router forwards packets between different networks. A switch connects devices inside a local network.'}
  ],
  questions:[
    {question:'What is the primary purpose of DNS?',options:['Encrypt internet traffic','Translate domain names to IP addresses','Connect devices physically','Block unwanted packets'],correctIndex:1,explanation:'DNS resolves human-readable names to numeric network addresses.',sourceQuote:'DNS translates human-readable domain names into IP addresses'},
    {question:'Which device forwards packets between different networks?',options:['Switch','Monitor','Router','Keyboard'],correctIndex:2,explanation:'Routers move packets across network boundaries.',sourceQuote:'A router forwards packets between different networks.'},
    {question:'Which network generally covers a university lab?',options:['LAN','WAN','Global satellite network','Internet backbone'],correctIndex:0,explanation:'A limited local area such as a lab is a LAN.',sourceQuote:'A Local Area Network (LAN) connects devices in a limited area'},
    {question:'What is a key benefit of HTTPS?',options:['Faster keyboards','More storage','No need for DNS','Encrypted communication'],correctIndex:3,explanation:'HTTPS protects data in transit through encryption.',sourceQuote:'HTTPS uses encryption to protect data in transit.'},
    {question:'What does packet switching do?',options:['Stores entire websites','Breaks data into smaller packets','Replaces IP addresses','Prevents all malware'],correctIndex:1,explanation:'Data is divided into packets and reassembled at the destination.',sourceQuote:'Packet switching breaks data into smaller packets'}
  ], mode:'demo',createdAt:new Date().toISOString()
};