import fs from 'node:fs';
import path from 'node:path';

export interface BroadcastList {
  id: string;
  name: string;
  contactNumbers: string[];
  createdAt: string;
  updatedAt: string;
}

const LISTAS_FILE = path.resolve(process.cwd(), 'listas.json');

class BroadcastListService {
  private lists: BroadcastList[] = [];

  constructor() {
    this.loadLists();
  }

  private loadLists(): void {
    try {
      if (fs.existsSync(LISTAS_FILE)) {
        const raw = fs.readFileSync(LISTAS_FILE, 'utf-8');
        this.lists = JSON.parse(raw);
        if (!Array.isArray(this.lists)) {
          this.lists = [];
        }
      } else {
        this.lists = [];
        this.saveLists();
      }
    } catch (err) {
      console.warn('Erro ao carregar listas.json:', err);
      this.lists = [];
    }
  }

  private saveLists(): void {
    try {
      fs.writeFileSync(LISTAS_FILE, JSON.stringify(this.lists, null, 2), 'utf-8');
    } catch (err) {
      console.error('Erro ao salvar listas.json:', err);
    }
  }

  public getAll(): BroadcastList[] {
    return this.lists.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  public getById(id: string): BroadcastList | undefined {
    return this.lists.find((l) => l.id === id);
  }

  public create(name: string, contactNumbers: string[]): BroadcastList {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('O nome da lista é obrigatório.');
    }

    const uniqueNumbers = Array.from(
      new Set(contactNumbers.map((n) => n.replace(/\D/g, '')).filter((n) => n.length >= 8))
    );

    const newList: BroadcastList = {
      id: 'lista_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: trimmedName,
      contactNumbers: uniqueNumbers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.lists.push(newList);
    this.saveLists();
    return newList;
  }

  public update(id: string, name: string, contactNumbers: string[]): BroadcastList {
    const listIndex = this.lists.findIndex((l) => l.id === id);
    if (listIndex === -1) {
      throw new Error('Lista de transmissão não encontrada.');
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('O nome da lista é obrigatório.');
    }

    const uniqueNumbers = Array.from(
      new Set(contactNumbers.map((n) => n.replace(/\D/g, '')).filter((n) => n.length >= 8))
    );

    const updatedList: BroadcastList = {
      ...this.lists[listIndex],
      name: trimmedName,
      contactNumbers: uniqueNumbers,
      updatedAt: new Date().toISOString(),
    };

    this.lists[listIndex] = updatedList;
    this.saveLists();
    return updatedList;
  }

  public delete(id: string): boolean {
    const listIndex = this.lists.findIndex((l) => l.id === id);
    if (listIndex === -1) {
      return false;
    }

    this.lists.splice(listIndex, 1);
    this.saveLists();
    return true;
  }
}

export const broadcastListService = new BroadcastListService();
