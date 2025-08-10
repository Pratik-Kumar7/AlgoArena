import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosClient from '../utils/axiosClient';

// Validation schema
const problemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  tags: z.string().min(1, 'Tags are required'),
  visibleTestCases: z.array(z.object({
    input: z.string(),
    output: z.string(),
    explanation: z.string().optional()
  })).min(1, 'At least one visible test case is required'),
  hiddenTestCases: z.array(z.object({
    input: z.string(),
    output: z.string()
  })).optional(),
  startCode: z.array(z.object({
    language: z.string(),
    initialCode: z.string()
  })).optional(),
  referenceSolution: z.array(z.object({
    language: z.string(),
    completeCode: z.string()
  })).optional()
});

function AdminUpdate() {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [fetchingProblem, setFetchingProblem] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      startCode: [
        { language: 'C++', initialCode: '' },
        { language: 'Java', initialCode: '' },
        { language: 'JavaScript', initialCode: '' }
      ],
      referenceSolution: [
        { language: 'C++', completeCode: '' },
        { language: 'Java', completeCode: '' },
        { language: 'JavaScript', completeCode: '' }
      ]
    }
  });

  const {
    fields: visibleFields,
    append: appendVisible,
    remove: removeVisible
  } = useFieldArray({
    control,
    name: 'visibleTestCases'
  });

  const {
    fields: hiddenFields,
    append: appendHidden,
    remove: removeHidden
  } = useFieldArray({
    control,
    name: 'hiddenTestCases'
  });

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      const { data } = await axiosClient.get('/problem/getAllProblem');
      setProblems(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching problems:', error);
      setLoading(false);
    }
  };

  const handleProblemSelect = async (problem) => {
    setFetchingProblem(true);
    try {
      // Fetch full problem details using admin route
      const { data } = await axiosClient.get(`/problem/problemById/${problem._id}/admin`);
      
      // Set form data
      reset({
        title: data.title || '',
        description: data.description || '',
        difficulty: data.difficulty || 'easy',
        tags: data.tags || '',
        visibleTestCases: data.visibleTestCases || [{ input: '', output: '', explanation: '' }],
        hiddenTestCases: data.hiddenTestCases || [],
        startCode: data.startCode || [
          { language: 'C++', initialCode: '' },
          { language: 'Java', initialCode: '' },
          { language: 'JavaScript', initialCode: '' }
        ],
        referenceSolution: data.referenceSolution || [
          { language: 'C++', completeCode: '' },
          { language: 'Java', completeCode: '' },
          { language: 'JavaScript', completeCode: '' }
        ]
      });
      
      setSelectedProblem(data);
    } catch (error) {
      console.error('Error fetching problem details:', error);
      alert('Error fetching problem details');
    } finally {
      setFetchingProblem(false);
    }
  };

  const onSubmit = async (data) => {
    if (!selectedProblem) return;
    
    setUpdating(true);
    try {
      const response = await axiosClient.put(`/problem/update/${selectedProblem._id}`, data);
      console.log("Update response:", response);
      alert('Problem updated successfully!');
      setSelectedProblem(null);
      fetchProblems(); // Refresh the list
    } catch (error) {
      console.log("Full error:", error);
      console.log("Error response:", error.response);
      console.log("Error data:", error.response?.data);
      
      let errorMessage = "An error occurred while updating the problem.";
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`Error: ${errorMessage}`);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Update Problem</h1>
        <button 
          onClick={() => navigate('/admin')}
          className="btn btn-ghost"
        >
          Back to Admin Panel
        </button>
      </div>

      {!selectedProblem ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">Select a Problem to Update</h2>
          <div className="grid gap-4">
            {problems.map((problem) => (
              <div 
                key={problem._id} 
                className="card bg-base-100 shadow-lg p-4 cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => handleProblemSelect(problem)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">{problem.title}</h3>
                    <div className="flex gap-2 mt-2">
                      <span className={`badge ${
                        problem.difficulty === 'easy' ? 'badge-success' : 
                        problem.difficulty === 'medium' ? 'badge-warning' : 'badge-error'
                      }`}>
                        {problem.difficulty}
                      </span>
                      <span className="badge badge-outline">{problem.tags}</span>
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm">
                    {fetchingProblem ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      'Update'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Update: {selectedProblem.title}</h2>
            <button 
              onClick={() => setSelectedProblem(null)}
              className="btn btn-ghost"
            >
              Back to List
            </button>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="card bg-base-100 shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Title</span>
                  </label>
                  <input
                    {...register('title')}
                    className={`input input-bordered ${errors.title && 'input-error'}`}
                  />
                  {errors.title && (
                    <span className="text-error">{errors.title.message}</span>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Description</span>
                  </label>
                  <textarea
                    {...register('description')}
                    className={`textarea textarea-bordered h-32 ${errors.description && 'textarea-error'}`}
                  />
                  {errors.description && (
                    <span className="text-error">{errors.description.message}</span>
                  )}
                </div>

                <div className="flex gap-4">
                  <div className="form-control w-1/2">
                    <label className="label">
                      <span className="label-text">Difficulty</span>
                    </label>
                    <select
                      {...register('difficulty')}
                      className={`select select-bordered ${errors.difficulty && 'select-error'}`}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div className="form-control w-1/2">
                    <label className="label">
                      <span className="label-text">Tag</span>
                    </label>
                    <select
                      {...register('tags')}
                      className={`select select-bordered ${errors.tags && 'select-error'}`}
                    >
                      <option value="array">Array</option>
                      <option value="linkedList">Linked List</option>
                      <option value="graph">Graph</option>
                      <option value="dp">DP</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Cases */}
            <div className="card bg-base-100 shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Test Cases</h2>
              
              {/* Visible Test Cases */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Visible Test Cases</h3>
                  <button
                    type="button"
                    onClick={() => appendVisible({ input: '', output: '', explanation: '' })}
                    className="btn btn-sm btn-primary"
                  >
                    Add Visible Case
                  </button>
                </div>
                
                {visibleFields.map((field, index) => (
                  <div key={field.id} className="border p-4 rounded-lg space-y-2">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeVisible(index)}
                        className="btn btn-xs btn-error"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <input
                      {...register(`visibleTestCases.${index}.input`)}
                      placeholder="Input"
                      className="input input-bordered w-full"
                    />
                    
                    <input
                      {...register(`visibleTestCases.${index}.output`)}
                      placeholder="Output"
                      className="input input-bordered w-full"
                    />
                    
                    <textarea
                      {...register(`visibleTestCases.${index}.explanation`)}
                      placeholder="Explanation"
                      className="textarea textarea-bordered w-full"
                    />
                  </div>
                ))}
              </div>

              {/* Hidden Test Cases */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Hidden Test Cases</h3>
                  <button
                    type="button"
                    onClick={() => appendHidden({ input: '', output: '' })}
                    className="btn btn-sm btn-primary"
                  >
                    Add Hidden Case
                  </button>
                </div>
                
                {hiddenFields.map((field, index) => (
                  <div key={field.id} className="border p-4 rounded-lg space-y-2">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeHidden(index)}
                        className="btn btn-xs btn-error"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <input
                      {...register(`hiddenTestCases.${index}.input`)}
                      placeholder="Input"
                      className="input input-bordered w-full"
                    />
                    
                    <input
                      {...register(`hiddenTestCases.${index}.output`)}
                      placeholder="Output"
                      className="input input-bordered w-full"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Code Templates */}
            <div className="card bg-base-100 shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Code Templates</h2>
              
              <div className="space-y-6">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="space-y-2">
                    <h3 className="font-medium">
                      {index === 0 ? 'C++' : index === 1 ? 'Java' : 'JavaScript'}
                    </h3>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Initial Code</span>
                      </label>
                      <pre className="bg-base-300 p-4 rounded-lg">
                        <textarea
                          {...register(`startCode.${index}.initialCode`)}
                          className="w-full bg-transparent font-mono"
                          rows={6}
                        />
                      </pre>
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Reference Solution</span>
                      </label>
                      <pre className="bg-base-300 p-4 rounded-lg">
                        <textarea
                          {...register(`referenceSolution.${index}.completeCode`)}
                          className="w-full bg-transparent font-mono"
                          rows={6}
                        />
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                type="submit" 
                className="btn btn-primary flex-1"
                disabled={updating}
              >
                {updating ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Updating...
                  </>
                ) : (
                  'Update Problem'
                )}
              </button>
              
              <button 
                type="button"
                className="btn btn-outline"
                onClick={() => setSelectedProblem(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AdminUpdate; 