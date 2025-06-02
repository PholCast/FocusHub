import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { User } from '../users/user.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}




  async create(userId: number, createCategoryDto: CreateCategoryDto): Promise<Category> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);


    const categoryName = createCategoryDto.name.toLowerCase();


    const existingCategory = await this.categoryRepository.findOne({
        where: { name: categoryName, user: { id: userId } },
    });
    if (existingCategory) {
        throw new Error(`Category with name '${categoryName}' already exists for this user`);
    }


    const category = this.categoryRepository.create({
        ...createCategoryDto,
        name: categoryName,
        user,
    });
    
    return this.categoryRepository.save(category);
}

 

  async findAll(userId: number): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'events', 'tasks'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, userId: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['user', 'events', 'tasks'],
    });

    if (!category) throw new NotFoundException(`Category with ID ${id} not found`);
    return category;
  }

  async update(id: number, userId: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id, userId);


    if (updateCategoryDto.name) {
        const newName = updateCategoryDto.name.toLowerCase();


        const existingCategory = await this.categoryRepository.findOne({
        where: {
            name: newName,
            user: { id: userId },
        },
        });


        if (existingCategory && existingCategory.id !== id) {
        throw new Error(`Category with name '${newName}' already exists for this user`);
        }


        updateCategoryDto.name = newName;
    }


    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }


  async remove(id: number, userId: number): Promise<void> {
    const category = await this.findOne(id, userId);
    await this.categoryRepository.remove(category);
  }
}
